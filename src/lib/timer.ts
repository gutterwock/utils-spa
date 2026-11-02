// Pure countdown helpers (tested in timer.test.ts).

export interface Interval {
  h: number
  m: number
  s: number
}

export const DEFAULT_INTERVALS: Interval[] = [{ h: 0, m: 5, s: 0 }]
const MAX_INTERVALS = 50
const MAX_SECONDS = 99 * 3600 + 59 * 60 + 59

export function toMs(h: number, m: number, s: number): number {
  const n = (x: number) => (Number.isFinite(x) && x > 0 ? Math.floor(x) : 0)
  return ((n(h) * 60 + n(m)) * 60 + n(s)) * 1000
}

/** Formats remaining time, rounding up so 0:00 only shows when truly done. */
export function formatMs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (x: number) => String(x).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export interface Position {
  /** index of the current interval */
  index: number
  /** ms left in the current interval */
  remaining: number
  done: boolean
}

/** Where `elapsed` ms falls in a sequence of interval durations (ms). */
export function position(durations: number[], elapsed: number): Position {
  let end = 0
  for (let i = 0; i < durations.length; i++) {
    end += durations[i]
    if (elapsed < end) return { index: i, remaining: end - elapsed, done: false }
  }
  return { index: durations.length - 1, remaining: 0, done: true }
}

/** Encodes intervals for the URL, e.g. "5:00,1:30,1:00:00". */
export function encodeIntervals(list: Interval[]): string {
  return list.map((i) => formatMs(toMs(i.h, i.m, i.s))).join(',')
}

/** Parses "5:00,90,1:00:00" (each part s, m:ss or h:mm:ss); undefined if anything is invalid. */
export function parseIntervals(raw: string | null): Interval[] | undefined {
  if (!raw) return undefined
  const parts = raw.split(',')
  if (parts.length > MAX_INTERVALS) return undefined
  const out: Interval[] = []
  for (const part of parts) {
    const bits = part.trim().split(':')
    if (bits.length > 3 || bits.some((b) => !/^\d+$/.test(b))) return undefined
    const [s = 0, m = 0, h = 0] = bits.map(Number).reverse()
    const total = h * 3600 + m * 60 + s
    if (total > MAX_SECONDS) return undefined
    out.push({ h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 })
  }
  return out
}
