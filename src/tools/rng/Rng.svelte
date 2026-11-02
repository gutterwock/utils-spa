<script lang="ts">
  import { hashParams, route, setHashParams } from '../../lib/router.svelte'
  import { load, save } from '../../lib/storage'
  import { DEFAULTS, chunk, fromQuery, generate, toQuery, validate } from './rng'

  const path = route.path
  // Precedence: URL > saved settings > defaults.
  const opts = $state({ ...DEFAULTS, ...load('rng.opts', {}), ...fromQuery(hashParams()) })
  let results = $state<number[]>([])
  let copied = $state(false)

  $effect(() => {
    const snap = $state.snapshot(opts)
    save('rng.opts', snap)
    setHashParams(path, toQuery(snap))
  })

  const error = $derived(validate(opts))
  const groups = $derived(chunk(results, opts.grouping))

  function roll() {
    if (error) return
    results = generate(opts)
    copied = false
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(groups.map((g) => g.join(' ')).join('\n'))
      copied = true
    } catch {
      // clipboard unavailable
    }
  }
</script>

<form
  class="opts"
  onsubmit={(e) => {
    e.preventDefault()
    roll()
  }}
>
  <label>Min <input type="number" step="1" bind:value={opts.min} /></label>
  <label>Max <input type="number" step="1" bind:value={opts.max} /></label>
  <label>Count <input type="number" min="1" step="1" bind:value={opts.count} /></label>
  <label>Grouping <input type="number" min="1" step="1" bind:value={opts.grouping} /></label>
  <label class="check"><input type="checkbox" bind:checked={opts.unique} /> No repeats</label>
  <label class="check"><input type="checkbox" bind:checked={opts.sequential} /> Sequential</label>
  <div class="actions">
    <button type="submit" class="primary" disabled={!!error}>Generate</button>
    <button type="button" onclick={() => Object.assign(opts, DEFAULTS)}>Defaults</button>
  </div>
</form>

{#if error}
  <p class="error">{error}</p>
{/if}

{#if results.length}
  <div class="results">
    {#each groups as group, i (i)}
      <div class="group">
        {#each group as n, j (j)}
          <span class="num">{n}</span>
        {/each}
      </div>
    {/each}
  </div>
  <button onclick={copy}>{copied ? 'Copied' : 'Copy'}</button>
{/if}

<style>
  .opts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
    align-items: end;
  }
  .opts label:not(.check) {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .check {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    grid-column: 1 / -1;
  }
  .results {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 1rem 0;
  }
  .group {
    display: flex;
    gap: 0.4rem;
    padding: 0.5rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .num {
    font-size: 1.6rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    min-width: 1.4ch;
    text-align: center;
  }
</style>
