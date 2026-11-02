import { compact, readFlag, readInt } from '../../lib/params'

// Pure RNG logic (tested in rng.test.ts). `random` returns a float in [0, 1)
// and is injectable for deterministic tests.

export interface RngOptions {
  min: number
  max: number
  /** how many numbers to generate */
  count: number
  /** no value appears twice in the set */
  unique: boolean
  /** sort ascending */
  sequential: boolean
}

export const MAX_COUNT = 1000

export function cryptoRandom(): number {
  const [a, b] = crypto.getRandomValues(new Uint32Array(2))
  return (a * 2 ** 21 + (b >>> 11)) / 2 ** 53
}

/** Returns an error message, or null if the options are valid. */
export function validate(o: RngOptions): string | null {
  if (![o.min, o.max].every(Number.isSafeInteger)) return 'Range must be whole numbers'
  if (!Number.isInteger(o.count)) return 'Count must be a whole number'
  if (o.min > o.max) return 'Min must be ≤ max'
  if (o.count < 1 || o.count > MAX_COUNT) return `Count must be 1–${MAX_COUNT}`
  const size = o.max - o.min + 1
  if (o.unique && o.count > size) return `No repeats: count can't exceed ${size} (range size)`
  return null
}

export function generate(o: RngOptions, random: () => number = cryptoRandom): number[] {
  const err = validate(o)
  if (err) throw new Error(err)
  const { min, max, count } = o
  const size = max - min + 1
  const pick = () => min + Math.floor(random() * size)

  let out: number[]
  if (!o.unique) {
    out = Array.from({ length: count }, pick)
  } else if (count * 2 > size) {
    // Dense: partial Fisher-Yates (size ≤ 2 * MAX_COUNT here).
    const pool = Array.from({ length: size }, (_, i) => min + i)
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(random() * (size - i))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    out = pool.slice(0, count)
  } else {
    // Sparse: rejection sampling, expected < 2 tries per value.
    const seen = new Set<number>()
    while (seen.size < count) seen.add(pick())
    out = [...seen]
  }
  return o.sequential ? out.sort((a, b) => a - b) : out
}

/** Splits into chunks of `size`; the remainder forms its own last chunk. */
export function chunk<T>(items: T[], size: number): T[][] {
  const n = Number.isInteger(size) && size >= 1 ? size : 1
  const out: T[][] = []
  for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n))
  return out
}

/** Everything the panel persists: generation options plus display grouping. */
export interface RngSettings extends RngOptions {
  grouping: number
}

export const DEFAULTS: RngSettings = { min: 0, max: 9, count: 1, grouping: 1, unique: false, sequential: false }

// URL keys: #/rng?min=1&max=49&count=6&group=3&norepeat=1&seq=1 (defaults omitted)
export function toQuery(s: RngSettings): URLSearchParams {
  const p = new URLSearchParams()
  const num = (key: string, v: number, d: number) => {
    if (Number.isSafeInteger(v) && v !== d) p.set(key, String(v))
  }
  num('min', s.min, DEFAULTS.min)
  num('max', s.max, DEFAULTS.max)
  num('count', s.count, DEFAULTS.count)
  num('group', s.grouping, DEFAULTS.grouping)
  if (s.unique) p.set('norepeat', '1')
  if (s.sequential) p.set('seq', '1')
  return p
}

export function fromQuery(p: URLSearchParams): Partial<RngSettings> {
  return compact({
    min: readInt(p, 'min'),
    max: readInt(p, 'max'),
    count: readInt(p, 'count', 1, MAX_COUNT),
    grouping: readInt(p, 'group', 1),
    unique: readFlag(p, 'norepeat'),
    sequential: readFlag(p, 'seq'),
  })
}
