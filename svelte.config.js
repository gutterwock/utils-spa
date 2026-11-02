/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  compilerOptions: {
    // Svelte 5 runes only: legacy Svelte 4 syntax (export let, $:, on:click) is a compile error.
    runes: true,
  },
}
