<script lang="ts">
  import Timer from './lib/Timer.svelte'
  import { href, route } from './lib/router.svelte'
  import { tools } from './tools'
  import { player, stop as stopMetronome } from './tools/metronome/player.svelte'

  const slug = $derived(route.path.replace(/^\//, ''))
  const tool = $derived(tools.find((t) => t.slug === slug))
</script>

<header>
  <a class="home" href={href('/')}><h1>Utils</h1></a>
  <Timer />
</header>

<main>
  {#if tool}
    <nav class="tabs" aria-label="Tools">
      {#each tools as t (t.slug)}
        <a href={href(`/${t.slug}`)} aria-current={t === tool ? 'page' : undefined}>{t.name}</a>
      {/each}
      {#if player.running && slug !== 'metronome'}
        <button class="stop-metronome" onclick={stopMetronome}>■ Stop metronome</button>
      {/if}
    </nav>
    <!-- Remount on real hash navigation (back/forward, edited URL) so the tool re-reads its URL params. -->
    {#key route.nav}
      {#await tool.load()}
        <p>Loading…</p>
      {:then mod}
        <mod.default />
      {:catch}
        <p class="error">Failed to load tool.</p>
      {/await}
    {/key}
  {:else if slug}
    <p>Unknown tool. <a href={href('/')}>Back to all tools</a></p>
  {:else}
    <ul class="tools">
      {#each tools as t (t.slug)}
        <li>
          <a href={href(`/${t.slug}`)}>
            <strong>{t.name}</strong>
            <span>{t.description}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</main>
