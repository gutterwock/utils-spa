# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page collection of small client-side utilities, hosted on GitHub Pages. Svelte 5 + TypeScript + Vite; no backend, everything runs in the browser. The owner does not hand-write code, so keep code simple, readable, and verified by `check` + tests before calling work done.

## Commands

```sh
npm run dev                                # dev server
npm run check                              # svelte-check (types + Svelte diagnostics) and tsc for vite.config.ts
npm test                                   # vitest, all tests
npx vitest run src/tools/rng               # tests under one path
npx vitest run -t "round-trips"            # tests matching a name
npm run build                              # check + production build to dist/
npm run preview                            # serve dist/ locally
```

CI (`.github/workflows/deploy.yml`) runs check → test → build on push to `main` and deploys `dist/` via GitHub Pages Actions.

## Svelte 5 runes only

`svelte.config.js` sets `compilerOptions.runes: true`, so Svelte 4 syntax is a compile error. Use `$state`, `$derived`/`$derived.by`, `$effect`, `$props()`, `onclick={...}` (not `on:click`), snippets/`{@render}` (not slots), and `mount()` (not `new App()`). Shared reactive state outside components must live in `.svelte.ts` files (see `src/lib/router.svelte.ts`).

## Architecture

- **Routing** — `src/lib/router.svelte.ts` is a minimal hash router (`#/slug`). Hash routing is required because GitHub Pages can't rewrite deep paths to `index.html`. Build links with `href()`; don't introduce history-mode routing.
- **Tool registry** — `src/tools/index.ts` exports the `tools` array. Each entry (`slug`, `name`, `description`, lazy `load`) automatically gets a home-page card and a route in `App.svelte`. Tools are lazy-loaded, so each is its own chunk.
- **Tool layout** — one folder per tool under `src/tools/<slug>/`: pure logic in `<slug>.ts` (no DOM), unit tests in `<slug>.test.ts`, UI in `<Name>.svelte`. Keep logic out of components so it's testable with Vitest (node environment, no DOM). Anything touching Web Audio or timers goes in a separate non-tested module (e.g. `metronome/engine.ts`).
- **Global interval timer** — `src/lib/Timer.svelte` is rendered in the `App.svelte` header, not registered as a tool, so it keeps running across route changes. It runs a user-editable list of intervals (default one) back to back: a short chime between intervals, a repeating alarm after the last. Time is computed from wall-clock elapsed (`banked + now - startedAt`) and mapped to the current interval by the pure `position()` in `src/lib/timer.ts`, so there's no drift. Sets `document.title` while active; alerts are muteable; intervals and mute persist.
- **Audio** — `src/lib/audio.ts` holds the single shared `AudioContext` and a `beep()` helper. Browsers only allow audio after a user gesture, so call `audio()` inside a click handler before sound is needed. The metronome uses look-ahead scheduling on the AudioContext clock (`engine.ts`); don't time clicks with `setInterval` directly.
- **Settings in the URL** — settings are mirrored to the URL so links are shareable. Global (timer) settings use the real query string (`?t=5:00,1:30`), which survives hash navigation; tool settings use a query after the hash (`#/rng?min=1&count=6`). Load precedence is URL > localStorage > defaults. Each tool's pure module exports `toQuery`/`fromQuery` (omit defaults; ignore invalid values via `readInt`/`readFlag`/`compact` in `src/lib/params.ts`), and the component calls `setHashParams(path, toQuery(...))` in an `$effect`. Writes use `history.replaceState` (no history entries, no `hashchange`); `App.svelte` remounts the tool on real hash navigation via `{#key route.nav}`. Only configuration goes in the URL, never live state (running/elapsed).
- **Persistence** — `src/lib/storage.ts` `load`/`save` wrap localStorage and never throw; settings are also saved under namespaced keys (`rng.opts`, `metronome.bpm`, `timer.intervals`, `timer.muted`) as the fallback when the URL has none.
- **Adding a tool** — create the folder per the layout above, then add one entry to `tools` in `src/tools/index.ts`.
- **Paths** — `vite.config.ts` uses `base: './'` so the build works at `https://<user>.github.io/<repo>/` regardless of repo name. Reference public assets with relative paths (`./favicon.svg`), not root-absolute ones.
- **Styling** — global styles and color tokens in `src/app.css` (dark-only "night mode", `color-scheme: dark`); use the CSS variables rather than hard-coded colors. Component-specific styles go in the component's `<style>` block.
