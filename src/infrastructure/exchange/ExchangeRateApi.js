import {
  createRateSnapshot,
  isFresh,
} from '@/application/ports/ExchangeRateProvider'
import { BASE_CURRENCY, CURRENCIES } from '@/domain/shared/currency'

const ENDPOINT = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`
const STORAGE_KEY = 'ticketexport:rates:v1'

function readCache(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(storage, snapshot) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {}
}

export function createExchangeRateApi({
  storage = globalThis.localStorage,
  fetcher = globalThis.fetch?.bind(globalThis),
} = {}) {
  let pending = null

  return {
    cached: () => readCache(storage),

    async load({ force = false } = {}) {
      const cache = readCache(storage)
      if (!force && isFresh(cache)) return cache
      if (pending) return pending

      pending = (async () => {
        try {
          const response = await fetcher(ENDPOINT)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)

          const payload = await response.json()
          if (payload.result !== 'success') throw new Error('resposta inválida')

          const rates = {}
          for (const { code } of CURRENCIES) {
            const rate = code === BASE_CURRENCY ? 1 : payload.rates?.[code]
            if (Number.isFinite(rate)) rates[code] = rate
          }

          const snapshot = createRateSnapshot(rates)
          writeCache(storage, snapshot)
          return snapshot
        } catch {
          return cache
        } finally {
          pending = null
        }
      })()

      return pending
    },
  }
}
