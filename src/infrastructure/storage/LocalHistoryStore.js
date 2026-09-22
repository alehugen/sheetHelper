import { HISTORY_LIMIT } from '@/application/ports/HistoryStore'

const STORAGE_KEY = 'ticketexport:history:v1'

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function createLocalHistoryStore({
  storage = globalThis.localStorage,
  key = STORAGE_KEY,
  limit = HISTORY_LIMIT,
} = {}) {
  function read() {
    if (!storage) return []
    try {
      return safeParse(storage.getItem(key) ?? '[]')
    } catch {
      return []
    }
  }

  function write(entries) {
    if (!storage) return entries
    try {
      storage.setItem(key, JSON.stringify(entries))
    } catch {
      return entries
    }
    return entries
  }

  return {
    read,

    save(entry) {
      const entries = [entry, ...read().filter((item) => item.id !== entry.id)]
      return write(entries.slice(0, limit))
    },

    remove(id) {
      return write(read().filter((entry) => entry.id !== id))
    },

    clear() {
      return write([])
    },
  }
}
