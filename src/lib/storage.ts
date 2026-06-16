// Namespaced, versioned localStorage wrapper. The rest of the app never touches
// localStorage directly — it goes through lib/api.ts, which uses this. Swapping
// to a remote backend means replacing api.ts, not this file.

const NS = 'fettle'
const VERSION = 1

function k(key: string): string {
  return `${NS}:v${VERSION}:${key}`
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
