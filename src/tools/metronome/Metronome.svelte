<script lang="ts">
  import { hashParams, route, setHashParams } from '../../lib/router.svelte'
  import { load, save } from '../../lib/storage'
  import { MetronomeEngine } from './engine'
  import {
    DEFAULT_BEATS,
    DEFAULT_BPM,
    MAX_BEATS,
    MAX_BPM,
    MIN_BPM,
    bpmFromTaps,
    clampBpm,
    fromQuery,
    toQuery,
  } from './metronome'

  const path = route.path
  // Precedence: URL > saved settings > defaults.
  const fromUrl = fromQuery(hashParams())
  let bpm = $state(fromUrl.bpm ?? clampBpm(load('metronome.bpm', DEFAULT_BPM)))
  let beatsPerBar = $state(fromUrl.beats ?? load('metronome.beats', DEFAULT_BEATS))
  let running = $state(false)
  let current = $state(-1)
  let taps: number[] = []

  const engine = new MetronomeEngine((b) => (current = b))

  $effect(() => {
    engine.bpm = clampBpm(bpm)
    save('metronome.bpm', clampBpm(bpm))
  })
  $effect(() => {
    engine.beatsPerBar = beatsPerBar
    save('metronome.beats', beatsPerBar)
  })
  $effect(() => setHashParams(path, toQuery(bpm, beatsPerBar)))
  $effect(() => () => engine.stop())

  function toggle() {
    running = !running
    if (running) engine.start()
    else {
      engine.stop()
      current = -1
    }
  }

  function nudge(d: number) {
    bpm = clampBpm(bpm + d)
  }

  function tap() {
    const now = performance.now()
    if (taps.length && now - taps[taps.length - 1] > 2000) taps = []
    taps.push(now)
    const t = bpmFromTaps(taps)
    if (t !== null) bpm = t
  }
</script>

<div class="metro">
  <div class="bpm">
    <button onclick={() => nudge(-5)} aria-label="Decrease 5 BPM">−5</button>
    <button onclick={() => nudge(-1)} aria-label="Decrease 1 BPM">−1</button>
    <label>
      <input
        type="number"
        min={MIN_BPM}
        max={MAX_BPM}
        bind:value={bpm}
        onblur={() => (bpm = clampBpm(bpm))}
        aria-label="BPM"
      />
      <span>BPM</span>
    </label>
    <button onclick={() => nudge(1)} aria-label="Increase 1 BPM">+1</button>
    <button onclick={() => nudge(5)} aria-label="Increase 5 BPM">+5</button>
  </div>

  <input type="range" min={MIN_BPM} max={MAX_BPM} bind:value={bpm} aria-label="BPM slider" />

  <div class="beats" aria-hidden="true">
    {#each { length: beatsPerBar }, i (i)}
      <span class="dot" class:on={current === i} class:accent={i === 0 && beatsPerBar > 1}></span>
    {/each}
  </div>

  <div class="controls">
    <button class="primary" onclick={toggle}>{running ? 'Stop' : 'Start'}</button>
    <button onclick={tap}>Tap tempo</button>
    <label>
      Beats per bar
      <select bind:value={beatsPerBar}>
        {#each { length: MAX_BEATS }, i (i)}
          <option value={i + 1}>{i + 1}</option>
        {/each}
      </select>
    </label>
  </div>
</div>

<style>
  .metro {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 480px;
  }
  .bpm {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  .bpm label {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .bpm input {
    width: 5.5rem;
    font-size: 2rem;
    font-weight: 600;
    text-align: center;
  }
  input[type='range'] {
    width: 100%;
  }
  .beats {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .dot {
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    border: 2px solid var(--border);
  }
  .dot.accent {
    border-color: var(--accent);
  }
  .dot.on {
    background: var(--fg);
    border-color: var(--fg);
  }
  .dot.on.accent {
    background: var(--accent);
    border-color: var(--accent);
  }
  .controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .controls label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: auto;
  }
</style>
