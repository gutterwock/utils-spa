import type { Component } from 'svelte'

export interface Tool {
  /** URL slug: the tool is served at #/<slug> */
  slug: string
  name: string
  description: string
  /** Lazy-loaded so each tool is its own chunk */
  load: () => Promise<{ default: Component }>
}

// Registry of every tool. Adding an entry here is all it takes to get
// a home-page card and a route.
export const tools: Tool[] = [
  {
    slug: 'rng',
    name: 'Random numbers',
    description: 'Random integers in a range, with grouping, no-repeat and sorted options.',
    load: () => import('./rng/Rng.svelte'),
  },
  {
    slug: 'metronome',
    name: 'Metronome',
    description: 'Adjustable BPM, accented downbeat, tap tempo.',
    load: () => import('./metronome/Metronome.svelte'),
  },
]
