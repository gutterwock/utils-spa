import { describe, expect, it } from 'vitest'
import { compact, joinHash, readFlag, readInt, splitHash, toQueryString } from './params'

describe('splitHash', () => {
  it('splits path and query', () => expect(splitHash('#/rng?min=1')).toEqual({ path: '/rng', query: 'min=1' }))
  it('handles no query', () => expect(splitHash('#/rng')).toEqual({ path: '/rng', query: '' }))
  it('defaults to /', () => expect(splitHash('')).toEqual({ path: '/', query: '' }))
})

describe('toQueryString / joinHash', () => {
  it('keeps : and , readable but encodes the rest', () => {
    expect(toQueryString(new URLSearchParams({ t: '5:00,1:30', x: 'a&b' }))).toBe('t=5:00,1:30&x=a%26b')
  })
  it('omits ? when empty', () => expect(joinHash('/rng', new URLSearchParams())).toBe('#/rng'))
  it('joins path and query', () => expect(joinHash('/rng', new URLSearchParams({ min: '1' }))).toBe('#/rng?min=1'))
})

describe('readInt', () => {
  const p = new URLSearchParams('a=5&b=-3&c=1.5&d=abc&e=')
  it('reads integers', () => {
    expect(readInt(p, 'a')).toBe(5)
    expect(readInt(p, 'b')).toBe(-3)
  })
  it('rejects non-integers, empty and missing', () => {
    expect(readInt(p, 'c')).toBeUndefined()
    expect(readInt(p, 'd')).toBeUndefined()
    expect(readInt(p, 'e')).toBeUndefined()
    expect(readInt(p, 'zzz')).toBeUndefined()
  })
  it('enforces bounds', () => expect(readInt(p, 'a', 1, 4)).toBeUndefined())
})

describe('readFlag', () => {
  const p = new URLSearchParams('a&b=1&c=0&d=maybe')
  it('parses flags', () => {
    expect(readFlag(p, 'a')).toBe(true)
    expect(readFlag(p, 'b')).toBe(true)
    expect(readFlag(p, 'c')).toBe(false)
    expect(readFlag(p, 'd')).toBeUndefined()
    expect(readFlag(p, 'missing')).toBeUndefined()
  })
})

describe('compact', () => {
  it('drops undefined only', () => expect(compact({ a: 1, b: undefined, c: false })).toEqual({ a: 1, c: false }))
})
