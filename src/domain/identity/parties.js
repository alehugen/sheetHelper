import { identifyBank } from '../shared/banks.js'
import { documentDigits, isMasked } from '../shared/document.js'
import { fold, namesMatch, normalizeName } from '../shared/text.js'

const MIN_PREFIX = 8

const SIDES = ['payer', 'payee']

export function sameName(a, b) {
  return namesMatch(a, b, MIN_PREFIX)
}

export function accountKey(bank, account) {
  const institution = identifyBank(bank) ?? fold(bank ?? '')
  const digits = String(account ?? '').replace(/[^\d/]/g, '')
  return institution && digits ? `${institution}|${digits}` : null
}

function sideOf(receipt, side) {
  return {
    name: receipt[`${side}Name`] ?? null,
    document: receipt[`${side}Document`] ?? null,
    bank: receipt[`${side}Bank`] ?? null,
    account: receipt[`${side}Account`] ?? null,
  }
}

function sameParty(a, b) {
  const docA = !isMasked(a.document) && documentDigits(a.document)
  const docB = !isMasked(b.document) && documentDigits(b.document)
  if (docA && docB) return docA === docB

  const accA = accountKey(a.bank, a.account)
  const accB = accountKey(b.bank, b.account)
  if (accA && accB) return accA === accB

  return sameName(a.name, b.name)
}

function absorb(party, side) {
  if (side.name) party.names.add(side.name)
  if (side.document) {
    ;(isMasked(side.document) ? party.maskedDocuments : party.documents).add(
      side.document,
    )
  }
  if (side.bank) party.banks.add(side.bank)
  const key = accountKey(side.bank, side.account)
  if (key) party.accounts.add(`${side.bank ?? ''}|${side.account}`)
  return party
}

function partyKey(party, index) {
  const document = [...party.documents][0]
  if (document) return `d:${documentDigits(document)}`
  const account = [...party.accounts][0]
  if (account) return `a:${account}`
  const name = [...party.names][0]
  if (name) return `n:${normalizeName(name)}`
  return `i:${index}`
}

export function discoverParties(receipts) {
  const parties = []

  for (const receipt of receipts) {
    for (const name of SIDES) {
      const side = sideOf(receipt, name)
      if (!side.name && !side.document && !side.account) continue

      const found = parties.find((party) =>
        party.samples.some((sample) => sameParty(sample, side)),
      )
      const party =
        found ??
        parties[
          parties.push({
            names: new Set(),
            documents: new Set(),
            maskedDocuments: new Set(),
            banks: new Set(),
            accounts: new Set(),
            samples: [],
            rows: 0,
            asPayer: 0,
            asPayee: 0,
          }) - 1
        ]

      party.samples.push(side)
      party.rows += 1
      party[name === 'payer' ? 'asPayer' : 'asPayee'] += 1
      absorb(party, side)
    }
  }

  return parties
    .map((party, index) => ({
      key: partyKey(party, index),
      label: [...party.names][0] ?? [...party.documents][0] ?? '—',
      names: [...party.names],
      documents: [...party.documents],
      maskedDocuments: [...party.maskedDocuments],
      banks: [...party.banks],
      accounts: [...party.accounts],
      rows: party.rows,
      asPayer: party.asPayer,
      asPayee: party.asPayee,
    }))
    .sort((a, b) => b.rows - a.rows)
}
