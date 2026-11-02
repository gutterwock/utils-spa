<script lang="ts">
  // Global interval timer, rendered in the header so it persists across routes.
  // Runs a list of intervals back to back: a short chime between intervals,
  // a repeating alarm after the last one.
  import { audio, beep } from './audio'
  import { searchParams, setSearchParam } from './router.svelte'
  import { load, save } from './storage'
  import {
    DEFAULT_INTERVALS,
    encodeIntervals,
    formatMs,
    parseIntervals,
    position,
    toMs,
    type Interval,
    type Position,
  } from './timer'

  const ALARM_MAX_MS = 60_000
  const blank = (): Interval => ({ ...DEFAULT_INTERVALS[0] })

  // Precedence: URL (?t=5:00,1:30) > saved settings > default (one 5:00 interval).
  const intervals = $state<Interval[]>(
    parseIntervals(searchParams().get('t')) ?? load('timer.intervals', structuredClone(DEFAULT_INTERVALS)),
  )
  let muted = $state(load('timer.muted', false))
  let status = $state<'idle' | 'running' | 'paused' | 'done'>('idle')
  let pos = $state<Position>({ index: 0, remaining: 0, done: false })

  // Snapshot of the non-zero interval durations for the current run.
  let plan = $state<number[]>([])
  // Wall-clock accounting: elapsed = banked + (now - startedAt) while running.
  let banked = 0
  let startedAt = 0
  let tick: number | undefined
  let alarm: number | undefined
  let alarmStop: number | undefined

  const total = $derived(intervals.reduce((sum, i) => sum + toMs(i.h, i.m, i.s), 0))

  $effect(() => {
    const snap = $state.snapshot(intervals)
    save('timer.intervals', snap)
    const t = encodeIntervals(snap)
    setSearchParam('t', t === encodeIntervals(DEFAULT_INTERVALS) ? null : t)
  })
  $effect(() => save('timer.muted', muted))

  $effect(() => {
    const base = 'Utils'
    if (status === 'running' || status === 'paused') {
      const n = plan.length > 1 ? ` (${pos.index + 1}/${plan.length})` : ''
      document.title = `${formatMs(pos.remaining)}${n} · ${base}`
    } else if (status === 'done') document.title = `⏰ Time's up · ${base}`
    else document.title = base
  })

  // Muting silences immediately; unmuting while done resumes the alarm.
  $effect(() => {
    if (muted) stopAlarm()
    else if (status === 'done' && alarm === undefined) startAlarm()
  })

  $effect(() => () => {
    clearInterval(tick)
    stopAlarm()
  })

  function start() {
    if (status === 'idle') {
      plan = intervals.map((i) => toMs(i.h, i.m, i.s)).filter((ms) => ms > 0)
      if (!plan.length) return
      banked = 0
      pos = position(plan, 0)
    }
    audio() // unlock audio inside the click gesture
    startedAt = Date.now()
    status = 'running'
    clearInterval(tick)
    tick = window.setInterval(update, 200)
  }

  function elapsed() {
    return banked + (status === 'running' ? Date.now() - startedAt : 0)
  }

  function update() {
    const prev = pos.index
    pos = position(plan, elapsed())
    if (pos.done) {
      clearInterval(tick)
      status = 'done'
      if (!muted) startAlarm()
    } else if (pos.index !== prev && !muted) {
      chime()
    }
  }

  function pause() {
    update()
    if (status !== 'running') return
    banked = elapsed()
    clearInterval(tick)
    status = 'paused'
  }

  function reset() {
    clearInterval(tick)
    stopAlarm()
    status = 'idle'
  }

  function chime() {
    // Descending bell-like triangle notes with long ring (~2.5s): deliberately
    // unlike the metronome's short sine clicks.
    const t = audio().currentTime
    const notes = [784, 659, 523] // G5 E5 C5
    for (let r = 0; r < 2; r++) {
      notes.forEach((freq, i) => {
        beep({ at: t + r * 1.2 + i * 0.3, freq, duration: 0.9, gain: 0.45, type: 'triangle' })
      })
    }
  }

  function startAlarm() {
    // Square-wave pulses: harsh on purpose, unlike the metronome's sine clicks.
    const ring = () =>
      [0, 0.15, 0.3].forEach((d) => beep({ at: audio().currentTime + d, freq: 740, duration: 0.1, gain: 0.2, type: 'square' }))
    ring()
    alarm = window.setInterval(ring, 1000)
    alarmStop = window.setTimeout(stopAlarm, ALARM_MAX_MS)
  }

  function stopAlarm() {
    clearInterval(alarm)
    clearTimeout(alarmStop)
    alarm = undefined
  }
</script>

<div class="timer" class:done={status === 'done'}>
  {#if status === 'idle'}
    <ol class="intervals">
      {#each intervals as iv, i (i)}
        <li>
          {#if intervals.length > 1}<span class="n">{i + 1}</span>{/if}
          <input type="number" min="0" max="99" bind:value={iv.h} aria-label="Interval {i + 1} hours" />:
          <input type="number" min="0" max="59" bind:value={iv.m} aria-label="Interval {i + 1} minutes" />:
          <input type="number" min="0" max="59" bind:value={iv.s} aria-label="Interval {i + 1} seconds" />
          {#if intervals.length > 1}
            <button class="x" onclick={() => intervals.splice(i, 1)} aria-label="Remove interval {i + 1}">×</button>
          {/if}
        </li>
      {/each}
    </ol>
    <button onclick={() => intervals.push(blank())}>+ Interval</button>
    <button class="primary" onclick={start} disabled={total <= 0}>Start</button>
  {:else}
    <span class="display" aria-live="polite">
      {#if status === 'done'}
        Time's up
      {:else}
        {formatMs(pos.remaining)}
        {#if plan.length > 1}<small>{pos.index + 1}/{plan.length}</small>{/if}
      {/if}
    </span>
    {#if plan.length > 1}
      <ol class="progress" aria-hidden="true">
        {#each plan as ms, i (i)}
          <li class:past={i < pos.index || status === 'done'} class:current={i === pos.index && status !== 'done'}>
            {formatMs(ms)}
          </li>
        {/each}
      </ol>
    {/if}
    {#if status === 'running'}
      <button onclick={pause}>Pause</button>
    {:else if status === 'paused'}
      <button class="primary" onclick={start}>Resume</button>
    {/if}
    <button onclick={reset}>{status === 'done' ? 'Dismiss' : 'Reset'}</button>
  {/if}
  <button
    class="mute"
    onclick={() => (muted = !muted)}
    aria-pressed={muted}
    title={muted ? 'Alerts muted' : 'Alerts on'}
  >
    {muted ? '🔕' : '🔔'}
  </button>
</div>

<style>
  .timer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  ol {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .intervals li {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
  }
  .intervals input {
    width: 3.2rem;
    text-align: center;
  }
  .n {
    color: var(--muted);
    font-size: 0.8rem;
    margin-right: 0.15rem;
  }
  .x {
    padding: 0.1rem 0.45rem;
    margin-left: 0.15rem;
  }
  .display {
    font-variant-numeric: tabular-nums;
    font-size: 1.25rem;
    font-weight: 600;
    min-width: 4.5rem;
    text-align: center;
  }
  .display small {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--muted);
    margin-left: 0.25rem;
  }
  .progress li {
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    padding: 0.1rem 0.4rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--muted);
  }
  .progress li.past {
    opacity: 0.45;
    text-decoration: line-through;
  }
  .progress li.current {
    border-color: var(--accent);
    color: var(--fg);
  }
  .mute {
    margin-left: auto;
  }
  .done {
    border-color: var(--accent);
    animation: flash 1s steps(2) infinite;
  }
  @keyframes flash {
    50% {
      background: var(--accent-soft);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .done {
      animation: none;
      background: var(--accent-soft);
    }
  }
</style>
