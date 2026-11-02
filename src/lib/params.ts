// Pure URL/query helpers (tested in params.test.ts). Settings are reflected in
// the URL so links are shareable: global settings (timer) in the real query
// string (?t=...), per-tool settings in a query after the hash (#/rng?min=1).

/** Splits "#/rng?min=1" into { path: "/rng", query: "min=1" }. */
export function splitHash(hash: string): { path: string; query: string } {
  const h = hash.replace(/^#/, '')
  const i = h.indexOf('?')
  return {
    path: (i === -1 ? h : h.slice(0, i)) || '/',
    query: i === -1 ? '' : h.slice(i + 1),
  }
}

/** Like URLSearchParams.toString(), but leaves ':' and ',' readable (e.g. t=5:00,1:30). */
export function toQueryString(params: URLSearchParams): string {
  const enc = (s: string) => encodeURIComponent(s).replace(/%3A/gi, ':').replace(/%2C/gi, ',')
  return [...params].map(([k, v]) => `${enc(k)}=${enc(v)}`).join('&')
}

export function joinHash(path: string, params: URLSearchParams): string {
  const q = toQueryString(params)
  return `#${path}${q ? `?${q}` : ''}`
}

/** Integer param within [min, max], or undefined if missing/invalid. */
export function readInt(p: URLSearchParams, key: string, min = -Infinity, max = Infinity): number | undefined {
  const raw = p.get(key)
  if (raw === null || raw.trim() === '') return undefined
  const n = Number(raw)
  return Number.isSafeInteger(n) && n >= min && n <= max ? n : undefined
}

/** Boolean param: present/1/true → true, 0/false → false, missing/garbage → undefined. */
export function readFlag(p: URLSearchParams, key: string): boolean | undefined {
  const raw = p.get(key)
  if (raw === null) return undefined
  const v = raw.trim().toLowerCase()
  if (['', '1', 'true', 'yes', 'on'].includes(v)) return true
  if (['0', 'false', 'no', 'off'].includes(v)) return false
  return undefined
}

/** Drops undefined values so the result can be spread over defaults. */
export function compact<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>
}
