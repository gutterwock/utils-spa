import { describe, expect, it } from 'vitest'
import { encodeIntervals, formatMs, parseIntervals, position, toMs } from './timer'

describe('toMs', () => {
  it('combines h/m/s', () => expect(toMs(1, 2, 3)).toBe(3_723_000))
  it('treats invalid/negative as 0', () => expect(toMs(NaN, -5, 10)).toBe(10_000))
  it('floors fractions', () => expect(toMs(0, 0, 1.9)).toBe(1000))
})

describe('formatMs', () => {
  it('formats m:ss', () => expect(formatMs(65_000)).toBe('1:05'))
  it('formats h:mm:ss', () => expect(formatMs(3_723_000)).toBe('1:02:03'))
  it('rounds up partial seconds', () => expect(formatMs(100)).toBe('0:01'))
  it('clamps at zero', () => expect(formatMs(-500)).toBe('0:00'))
})

describe('position', () => {
  const d = [1000, 2000, 500]
  it('starts in the first interval', () => expect(position(d, 0)).toEqual({ index: 0, remaining: 1000, done: false }))
  it('moves to the next interval at the boundary', () =>
    expect(position(d, 1000)).toEqual({ index: 1, remaining: 2000, done: false }))
  it('tracks the last interval', () => expect(position(d, 3200)).toEqual({ index: 2, remaining: 300, done: false }))
  it('is done after the total', () => expect(position(d, 3500)).toEqual({ index: 2, remaining: 0, done: true }))
  it('handles a single interval', () => expect(position([5000], 4000).remaining).toBe(1000))
})

describe('interval URL codec', () => {
  it('encodes compactly', () =>
    expect(encodeIntervals([{ h: 0, m: 5, s: 0 }, { h: 1, m: 0, s: 30 }])).toBe('5:00,1:00:30'))
  it('round-trips', () => {
    const list = [{ h: 0, m: 0, s: 45 }, { h: 2, m: 3, s: 4 }]
    expect(parseIntervals(encodeIntervals(list))).toEqual(list)
  })
  it('accepts bare seconds and normalises overflow', () =>
    expect(parseIntervals('90')).toEqual([{ h: 0, m: 1, s: 30 }]))
  it('rejects garbage', () => {
    expect(parseIntervals('5:00,abc')).toBeUndefined()
    expect(parseIntervals('1:2:3:4')).toBeUndefined()
    expect(parseIntervals('')).toBeUndefined()
    expect(parseIntervals(null)).toBeUndefined()
  })
})
