import { describe, expect, it } from 'vitest'
import { DEFAULTS, chunk, fromQuery, generate, toQuery, validate, type RngOptions } from './rng'

const base: RngOptions = { min: 0, max: 9, count: 1, unique: false, sequential: false }

describe('generate', () => {
  it('stays within the inclusive range', () => {
    const out = generate({ ...base, count: 500 })
    expect(out).toHaveLength(500)
    expect(out.every((n) => n >= 0 && n <= 9 && Number.isInteger(n))).toBe(true)
  })

  it('hits both ends of the range', () => {
    expect(generate({ ...base, min: 3, max: 7 }, () => 0)).toEqual([3])
    expect(generate({ ...base, min: 3, max: 7 }, () => 0.9999)).toEqual([7])
  })

  it('no repeats yields distinct values (dense and sparse paths)', () => {
    const dense = generate({ ...base, count: 10, unique: true })
    expect(new Set(dense).size).toBe(10)
    const sparse = generate({ ...base, max: 1_000_000, count: 100, unique: true })
    expect(new Set(sparse).size).toBe(100)
  })

  it('sequential sorts ascending', () => {
    const out = generate({ ...base, min: -50, max: 50, count: 30, sequential: true })
    expect(out).toEqual([...out].sort((a, b) => a - b))
  })

  it('throws on invalid options', () => {
    expect(() => generate({ ...base, count: 11, unique: true })).toThrow(/range size/)
  })
})

describe('validate', () => {
  it('accepts defaults', () => expect(validate(base)).toBeNull())
  it('rejects min > max', () => expect(validate({ ...base, min: 5, max: 1 })).toMatch(/Min/))
  it('rejects non-integers', () => expect(validate({ ...base, max: 1.5 })).toMatch(/whole/))
  it('rejects count 0', () => expect(validate({ ...base, count: 0 })).toMatch(/Count/))
})

describe('chunk', () => {
  it('puts the remainder in its own group', () => {
    const groups = chunk(Array.from({ length: 16 }, (_, i) => i), 5)
    expect(groups.map((g) => g.length)).toEqual([5, 5, 5, 1])
  })
  it('falls back to 1 for invalid sizes', () => {
    expect(chunk([1, 2], 0)).toEqual([[1], [2]])
  })
})

describe('URL codec', () => {
  it('omits defaults', () => expect(toQuery(DEFAULTS).toString()).toBe(''))
  it('round-trips', () => {
    const s = { min: -5, max: 49, count: 16, grouping: 5, unique: true, sequential: true }
    expect({ ...DEFAULTS, ...fromQuery(toQuery(s)) }).toEqual(s)
  })
  it('ignores invalid values', () =>
    expect(fromQuery(new URLSearchParams('min=abc&count=0&group=2&seq=maybe'))).toEqual({ grouping: 2 }))
})
