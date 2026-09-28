import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { documentMatches } from '@/domain/identity/documents'
import {
  MatchLevel,
  createProfile,
  resolveDirection,
} from '@/domain/identity/direction'
import { discoverParties } from '@/domain/identity/parties'
import { documentDigits } from '@/domain/shared/document'

import { useReceiptsStore } from './receipts'

const MIN_DOCUMENT_DIGITS = 11

export const useIdentityStore = defineStore('identity', () => {
  const documents = useStorage('sheethelper:documents', [])
  const added = ref([])
  const removed = ref([])

  const receipts = useReceiptsStore()

  const parties = computed(() => discoverParties(receipts.receipts))

  const suggested = computed(() =>
    parties.value
      .filter(
        (party) =>
          documentMatches(party.documents[0], documents.value) ||
          party.maskedDocuments.some((masked) =>
            documentMatches(masked, documents.value),
          ),
      )
      .map((party) => party.key),
  )

  const selectedParties = computed(() =>
    parties.value.filter(
      (party) =>
        (suggested.value.includes(party.key) ||
          added.value.includes(party.key)) &&
        !removed.value.includes(party.key),
    ),
  )

  const selected = computed(() =>
    selectedParties.value.map((party) => party.key),
  )

  const profile = computed(() =>
    createProfile(selectedParties.value, documents.value),
  )

  const entries = computed(() =>
    receipts.rows.map((row) => {
      const { direction, via } = resolveDirection(row.receipt, profile.value)
      return { ...row, direction, via }
    }),
  )

  const unresolved = computed(
    () => entries.value.filter((entry) => !entry.direction).length,
  )

  const matchedBy = computed(() =>
    Object.values(MatchLevel)
      .map((level) => ({
        level,
        count: entries.value.filter((entry) => entry.via === level).length,
      }))
      .filter((item) => item.count),
  )

  const isReady = computed(() => selected.value.length > 0)

  function addDocument(value) {
    const digits = documentDigits(value)
    if (!digits || digits.length < MIN_DOCUMENT_DIGITS) return false
    if (documents.value.some((known) => documentDigits(known) === digits)) {
      return false
    }
    documents.value = [...documents.value, value.trim()]
    return true
  }

  function removeDocument(value) {
    documents.value = documents.value.filter((known) => known !== value)
  }

  function toggle(key) {
    if (selected.value.includes(key)) {
      added.value = added.value.filter((entry) => entry !== key)
      removed.value = [...removed.value, key]
      return
    }
    removed.value = removed.value.filter((entry) => entry !== key)
    added.value = [...added.value, key]
  }

  return {
    documents,
    selected,
    parties,
    suggested,
    selectedParties,
    profile,
    entries,
    unresolved,
    matchedBy,
    isReady,
    addDocument,
    removeDocument,
    toggle,
  }
})
