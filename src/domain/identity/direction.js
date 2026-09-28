import { Direction } from '../shared/direction.js'

import { documentMatches } from './documents.js'
import { accountKey, sameName } from './parties.js'

export const MatchLevel = {
  DOCUMENT: 'document',
  MASKED: 'masked',
  ACCOUNT: 'account',
  NAME: 'name',
}

export function createProfile(parties, extraDocuments = []) {
  const accounts = parties.flatMap((party) =>
    party.accounts
      .map((entry) => {
        const [bank, account] = entry.split('|')
        return accountKey(bank, account)
      })
      .filter(Boolean),
  )

  return {
    documents: [
      ...new Set([...parties.flatMap((p) => p.documents), ...extraDocuments]),
    ],
    accounts: [...new Set(accounts)],
    names: [...new Set(parties.flatMap((p) => p.names))],
  }
}

function matchSide(receipt, side, profile) {
  const byDocument = documentMatches(
    receipt[`${side}Document`],
    profile.documents,
  )
  if (byDocument) return byDocument

  const key = accountKey(receipt[`${side}Bank`], receipt[`${side}Account`])
  if (key && profile.accounts.includes(key)) return MatchLevel.ACCOUNT

  const name = receipt[`${side}Name`]
  if (profile.names.some((known) => sameName(known, name))) {
    return MatchLevel.NAME
  }

  return null
}

export function resolveDirection(receipt, profile) {
  const payer = matchSide(receipt, 'payer', profile)
  const payee = matchSide(receipt, 'payee', profile)

  if (payer && payee) return { direction: Direction.INTERNAL, via: payee }
  if (payee) return { direction: Direction.CREDIT, via: payee }
  if (payer) return { direction: Direction.DEBIT, via: payer }
  return { direction: null, via: null }
}
