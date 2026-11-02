import { describe, expect, it } from 'vitest'
import { bpmFromTaps, clampBpm, fromQuery, secondsPerBeat, toQuery } from './metronome'

describe('clampBpm', () => {
  it('clamps and rounds', () => {
    expect(clampBpm(5)).toBe(20)
    expect(clampBpm(999)).toBe(300)
    expect(clampBpm(120.6)).toBe(121)
    expect(clampBpm(NaN)).toBe(120)
  })
})

describe('secondsPerBeat', () => {
  it('converts bpm', () => expect(secondsPerBeat(120)).toBe(0.5))
})

describe('bpmFromTaps', () => {
  it('needs two taps', () => expect(bpmFromTaps([1000])).toBeNull())
  it('averages intervals', () => expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120))
  it('uses only the most recent taps', () => {
    const slow = [0, 1000, 2000]
    const fast = Array.from({ length: 9 }, (_, i) => 3000 + i * 250)
    expect(bpmFromTaps([...slow, ...fast])).toBe(240)
  })
})

describe('URL codec', () => {
  it('omits defaults', () => expect(toQuery(120, 4).toString()).toBe(''))
  it('round-trips', () => expect(fromQuery(toQuery(96, 3))).toEqual({ bpm: 96, beats: 3 }))
  it('clamps bpm and rejects bad beats', () =>
    expect(fromQuery(new URLSearchParams('bpm=9999&beats=40'))).toEqual({ bpm: 300 }))
})
