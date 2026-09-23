import { BASE_CURRENCY } from '@/domain/shared/currency'

const RATE_TTL_MS = 6 * 60 * 60 * 1000

export function createRateSnapshot(rates, fetchedAt = Date.now()) {
  return { base: BASE_CURRENCY, rates, fetchedAt }
}

export function isFresh(snapshot, now = Date.now()) {
  return Boolean(snapshot) && now - snapshot.fetchedAt < RATE_TTL_MS
}
