import { itau } from './itau.js'
import { nubank } from './nubank.js'

export const ISSUERS = [nubank, itau]

export function issuerById(id) {
  return ISSUERS.find((issuer) => issuer.id === id) ?? null
}
