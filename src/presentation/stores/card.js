import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { container } from '@/container'
import { amountOf, isSpending } from '@/domain/card/CardEntry'
import { categorize } from '@/domain/card/categories'
import { findings } from '@/domain/card/findings'
import {
  committedNext,
  committedTotal,
  futureCommitment,
  installmentShare,
} from '@/domain/card/installments'
import { ISSUERS, issuerById } from '@/domain/card/issuers'
import { checkStatement, readStatement } from '@/domain/card/readStatement'
import { fold } from '@/domain/shared/text'

export const useCardStore = defineStore('card', () => {
  const issuerId = useStorage('sheethelper:card-issuer', '')
  const overrides = useStorage('sheethelper:card-categories', {})

  const fileName = ref('')
  const isReading = ref(false)
  const error = ref(null)
  const statement = ref(null)

  const issuer = computed(() => issuerById(issuerId.value))

  const checks = computed(() =>
    statement.value && issuer.value
      ? checkStatement(statement.value, issuer.value)
      : [],
  )

  const reconciles = computed(
    () => checks.value.length > 0 && checks.value.every((check) => check.ok),
  )

  const entries = computed(() =>
    (statement.value?.entries ?? []).map((entry) => ({
      ...entry,
      ...categorize(entry, overrides.value),
    })),
  )

  const spending = computed(() => entries.value.filter(isSpending))

  const current = computed(() =>
    spending.value.filter((entry) => entry.section !== 'upcoming'),
  )

  const upcoming = computed(() =>
    entries.value.filter((entry) => entry.section === 'upcoming'),
  )

  const total = computed(() =>
    current.value.reduce((sum, entry) => sum + amountOf(entry), 0),
  )

  // O Itaú traz as parcelas futuras em seção própria; no Nubank elas precisam
  // ser derivadas das parcelas do próprio mês.
  const installments = computed(() =>
    upcoming.value.length ? upcoming.value : current.value,
  )

  const curve = computed(() => futureCommitment(installments.value))

  const declaredNext = computed(
    () => statement.value?.declared?.nextInvoice ?? null,
  )

  const declaredTotal = computed(
    () => statement.value?.declared?.futureTotal ?? null,
  )

  // O que o emissor declara manda: ele enxerga cartões e ciclos que o PDF não
  // detalha. A nossa conta serve para desenhar a curva e para desconfiar.
  const nextInvoice = computed(
    () => declaredNext.value ?? committedNext(installments.value),
  )

  const committed = computed(
    () => declaredTotal.value ?? committedTotal(installments.value),
  )

  const divergence = computed(() => {
    if (declaredNext.value === null) return null
    const ours = committedNext(installments.value)
    if (!ours) return null
    const difference = Math.round((ours - declaredNext.value) * 100) / 100
    return Math.abs(difference) <= 0.05 ? null : { ours, difference }
  })

  const fromInstallments = computed(() => installmentShare(current.value))

  const alerts = computed(() => findings(current.value))

  const uncategorized = computed(
    () => current.value.filter((entry) => !entry.category).length,
  )

  function setIssuer(id) {
    issuerId.value = id
    reset()
  }

  function assign(merchant, category) {
    overrides.value = { ...overrides.value, [fold(merchant)]: category }
  }

  function reset() {
    statement.value = null
    fileName.value = ''
    error.value = null
  }

  async function read(file) {
    if (!issuer.value) return
    isReading.value = true
    error.value = null
    fileName.value = file.name

    try {
      const { text } = await container.textExtractor.extract(file)
      statement.value = readStatement(text, issuer.value)
      if (!statement.value.entries.length) error.value = 'empty'
    } catch (cause) {
      error.value = cause?.message ?? 'failed'
      statement.value = null
    } finally {
      isReading.value = false
    }
  }

  return {
    issuers: ISSUERS,
    issuerId,
    issuer,
    fileName,
    isReading,
    error,
    statement,
    checks,
    reconciles,
    entries,
    current,
    total,
    curve,
    nextInvoice,
    committed,
    divergence,
    fromInstallments,
    alerts,
    uncategorized,
    setIssuer,
    assign,
    read,
    reset,
  }
})
