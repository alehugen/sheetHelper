const STORAGE_KEY = 'ticketexport:mappings:v2'

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function createLocalMappingStore({
  storage = globalThis.localStorage,
  key = STORAGE_KEY,
} = {}) {
  function readAll() {
    if (!storage) return {}
    try {
      return safeParse(storage.getItem(key) ?? '{}')
    } catch {
      return {}
    }
  }

  return {
    get(fingerprint) {
      return readAll()[fingerprint] ?? null
    },

    save(fingerprint, mapping) {
      const all = readAll()
      all[fingerprint] = mapping
      try {
        storage?.setItem(key, JSON.stringify(all))
      } catch {
        return mapping
      }
      return mapping
    },

    forget(fingerprint) {
      const all = readAll()
      delete all[fingerprint]
      try {
        storage?.setItem(key, JSON.stringify(all))
      } catch {
        return null
      }
      return null
    },
  }
}
