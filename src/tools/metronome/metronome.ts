import { compact, readInt } from '../../lib/params'

// Pure metronome helpers (tested in metronome.test.ts).

export const MIN_BPM = 20
export const MAX_BPM = 300

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

export function secondsPerBeat(bpm: number): number {
  return 60 / clampBpm(bpm)
}

/** BPM from tap timestamps (ms, ascending), averaging up to the last 8 intervals. */
export function bpmFromTaps(taps: number[]): number | null {
  const recent = taps.slice(-9)
  if (recent.length < 2) return null
  const avg = (recent[recent.length - 1] - recent[0]) / (recent.length - 1)
  return avg > 0 ? clampBpm(60_000 / avg) : null
}

export const DEFAULT_BPM = 120
export const DEFAULT_BEATS = 4
export const MAX_BEATS = 12

// URL keys: #/metronome?bpm=96&beats=3 (defaults omitted)
export function toQuery(bpm: number, beats: number): URLSearchParams {
  const p = new URLSearchParams()
  if (clampBpm(bpm) !== DEFAULT_BPM) p.set('bpm', String(clampBpm(bpm)))
  if (beats !== DEFAULT_BEATS) p.set('beats', String(beats))
  return p
}

export function fromQuery(p: URLSearchParams): { bpm?: number; beats?: number } {
  const bpm = readInt(p, 'bpm')
  return compact({
    bpm: bpm === undefined ? undefined : clampBpm(bpm),
    beats: readInt(p, 'beats', 1, MAX_BEATS),
  })
}
