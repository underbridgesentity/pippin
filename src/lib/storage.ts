// Namespaced, versioned localStorage wrapper. The rest of the app never touches
// localStorage directly, it goes through lib/api.ts, which uses this. Swapping
// to a remote backend means replacing api.ts, not this file.

const NS = 'pippin'
const OLD_NS = 'fettle'
const VERSION = 1

function k(key: string): string {
  return `${NS}:v${VERSION}:${key}`
}

// One-time migration from the old 'fettle' namespace so existing local data
// (local-mode accounts, cached plans) survives the rename to Pippin.
try {
  const prefix = `${OLD_NS}:v${VERSION}:`
  const oldKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) oldKeys.push(key)
  }
  for (const key of oldKeys) {
    const nk = `${NS}:v${VERSION}:${key.slice(prefix.length)}`
    const val = localStorage.getItem(key)
    if (val != null && localStorage.getItem(nk) == null) localStorage.setItem(nk, val)
  }
} catch {
  /* ignore */
}

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(k(key))
      return raw == null ? null : (JSON.parse(raw) as T)
    } catch {
      return null
    }
  },
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(k(key), JSON.stringify(value))
      return true
    } catch {
      // Most likely a QuotaExceededError (too many/large meal photos).
      return false
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(k(key))
    } catch {
      /* ignore */
    }
  },
}
