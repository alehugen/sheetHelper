import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

import {
  MatchLevel,
  createProfile,
  resolveDirection,
} from '@/domain/identity/direction'
import { documentMatches } from '@/domain/identity/documents'
import { discoverParties, matchesNameQuery } from '@/domain/identity/parties'
import { documentDigits } from '@/domain/shared/document'

import { useReceiptsStore } from './receipts'

const MIN_DOCUMENT_DIGITS = 11
const MIN_DOCUMENT_QUERY = 2

export const useIdentityStore = defineStore('identity', () => {
  const documentFilter = useStorage('sheethelper:document', '')
  const nameFilter = useStorage('sheethelper:name', '')
  const added = useStorage('sheethelper:parties-on', [])
  const removed = useStorage('sheethelper:parties-off', [])

  const receipts = useReceiptsStore()

  const parties = computed(() => discoverParties(receipts.receipts))

  const typedDigits = computed(() => documentDigits(documentFilter.value))

  const ownDocument = computed(() =>
    typedDigits.value.length >= MIN_DOCUMENT_DIGITS
      ? documentFilter.value
      : null,
  )

  function matchesDocumentPrefix(party) {
    if (typedDigits.value.length < MIN_DOCUMENT_QUERY) return false
    return party.documents.some((document) =>
      documentDigits(document).startsWith(typedDigits.value),
    )
  }

  function matchesDocument(party) {
    if (!ownDocument.value) return false
    const known = [ownDocument.value]
    return (
      documentMatches(party.documents[0], known) ||
      party.maskedDocuments.some((masked) => documentMatches(masked, known))
    )
  }

  function matchesName(party) {
    return matchesNameQuery(party.names, nameFilter.value)
  }

  const suggested = computed(() =>
    parties.value.filter(matchesDocument).map((party) => party.key),
  )

  const isFiltering = computed(
    () =>
      typedDigits.value.length >= MIN_DOCUMENT_QUERY ||
      nameFilter.value.trim().length > 0,
  )

  const listedParties = computed(() => {
    if (!isFiltering.value)
      return parties.value.filter((party) => party.rows > 1)
    return parties.value.filter(
      (party) =>
        matchesDocument(party) ||
        matchesDocumentPrefix(party) ||
        matchesName(party) ||
        selected.value.includes(party.key),
    )
  })

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
    createProfile(
      selectedParties.value,
      ownDocument.value ? [ownDocument.value] : [],
    ),
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

  const resolvedCount = computed(
    () => entries.value.filter((entry) => entry.direction).length,
  )

  const accountCount = computed(
    () =>
      new Set(selectedParties.value.flatMap((party) => party.accounts)).size,
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
    documentFilter,
    nameFilter,
    isFiltering,
    parties,
    listedParties,
    suggested,
    selected,
    selectedParties,
    profile,
    entries,
    unresolved,
    resolvedCount,
    accountCount,
    matchedBy,
    isReady,
    toggle,
  }
})
