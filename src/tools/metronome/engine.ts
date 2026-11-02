// Look-ahead scheduler: a 25ms JS timer queues clicks on the Web Audio clock
// ~100ms ahead, so timing stays sample-accurate even when JS is jittery.
import { audio, beep } from '../../lib/audio'
import { secondsPerBeat } from './metronome'

const LOOKAHEAD_S = 0.1
const INTERVAL_MS = 25

export class MetronomeEngine {
  bpm = 120
  beatsPerBar = 4

  private count = 0
  private nextTime = 0
  private timer: number | undefined
  private pending = new Set<number>()

  constructor(private onBeat: (beat: number) => void) {}

  start(): void {
    this.stop()
    this.count = 0
    this.nextTime = audio().currentTime + 0.05
    this.timer = window.setInterval(() => this.schedule(), INTERVAL_MS)
    this.schedule()
  }

  stop(): void {
    clearInterval(this.timer)
    this.timer = undefined
    for (const id of this.pending) clearTimeout(id)
    this.pending.clear()
  }

  private schedule(): void {
    const ctx = audio()
    // Background tabs throttle timers to ~1s; skip missed beats instead of bursting them.
    if (this.nextTime < ctx.currentTime - 0.05) this.nextTime = ctx.currentTime + 0.05
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      const beat = this.count % this.beatsPerBar
      const accent = beat === 0 && this.beatsPerBar > 1
      beep({ at: this.nextTime, freq: accent ? 1600 : 1000, duration: 0.04, gain: accent ? 0.5 : 0.3 })

      // Fire the visual callback when the click is actually heard.
      const id = window.setTimeout(
        () => {
          this.pending.delete(id)
          this.onBeat(beat)
        },
        Math.max(0, (this.nextTime - ctx.currentTime) * 1000),
      )
      this.pending.add(id)

      this.nextTime += secondsPerBeat(this.bpm)
      this.count++
    }
  }
}
