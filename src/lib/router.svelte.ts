// Minimal hash router. GitHub Pages can't rewrite unknown paths to index.html,
// so routes live in the hash (#/rng) and deep links always load the app.
// A tool's settings ride along as a query after the hash (#/rng?min=1).
import { joinHash, splitHash, toQueryString } from './params'

export const route = $state({
  path: splitHash(window.location.hash).path,
  /** Bumped on every real hashchange (not replaceState) so tools can remount. */
  nav: 0,
})

window.addEventListener('hashchange', () => {
  route.path = splitHash(window.location.hash).path
  route.nav++
})

export function href(path: string): string {
  return `#${path}`
}

/** Query params after the hash, e.g. #/rng?min=1 → min=1. */
export function hashParams(): URLSearchParams {
  return new URLSearchParams(splitHash(window.location.hash).query)
}

/**
 * Replaces the hash query in place (no history entry). Skipped if the user has
 * already navigated away from `path`, so a stale write can't clobber another route.
 */
export function setHashParams(path: string, params: URLSearchParams): void {
  if (splitHash(window.location.hash).path !== path) return
  replaceUrl(window.location.search, joinHash(path, params))
}

/** Real query string params (before the hash), used for global settings. */
export function searchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

export function setSearchParam(key: string, value: string | null): void {
  const p = searchParams()
  if (value === null) p.delete(key)
  else p.set(key, value)
  const q = toQueryString(p)
  replaceUrl(q ? `?${q}` : '', window.location.hash)
}

function replaceUrl(search: string, hash: string): void {
  const { pathname, search: curSearch, hash: curHash } = window.location
  if (search === curSearch && hash === curHash) return
  history.replaceState(history.state, '', pathname + search + hash)
}
