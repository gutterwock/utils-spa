// Module-level metronome playback, so it keeps running when the Metronome
// component unmounts (e.g. switching to another tool tab).
import { MetronomeEngine } from './engine'

export const player = $state({ running: false, current: -1 })

export const engine = new MetronomeEngine((b) => (player.current = b))

export function toggle(): void {
  player.running = !player.running
  if (player.running) engine.start()
  else {
    engine.stop()
    player.current = -1
  }
}

export function stop(): void {
  if (player.running) toggle()
}
