// Shared Web Audio helpers. The AudioContext must first be created/resumed
// inside a user gesture (click), so call audio() from a click handler before
// relying on sound.

let ctx: AudioContext | null = null

export function audio(): AudioContext {
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export interface BeepOptions {
  /** AudioContext time (seconds) to start; defaults to now */
  at?: number
  freq?: number
  /** seconds */
  duration?: number
  gain?: number
  /** oscillator waveform; the metronome uses the default sine */
  type?: OscillatorType
}

export function beep({ at, freq = 880, duration = 0.08, gain = 0.3, type = 'sine' }: BeepOptions = {}): void {
  const c = audio()
  const t = at ?? c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  // Short attack + exponential decay to avoid clicks.
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.003)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g).connect(c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.01)
}
