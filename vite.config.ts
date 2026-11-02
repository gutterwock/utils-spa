import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // Relative base so the build works at https://<user>.github.io/<repo>/ regardless of repo name.
  base: './',
  test: {
    include: ['src/**/*.test.ts'],
  },
})
