import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Where the app will be served from.
 *
 * GitHub Pages serves it from a project subpath, so `/argus/` stays the
 * default and nothing about that deployment changes. Firebase Hosting serves it
 * from the root of its own domain, and a bundle built for the subpath cannot
 * boot there: `index.html` would ask for `/argus/assets/...`, the SPA rewrite
 * would answer every one of those with `index.html`, and the page would load a
 * document where it expected its own JavaScript.
 *
 * `npm run build:firebase` sets this to `/`.
 */
const base = process.env.ARGUS_BASE ?? '/argus/'

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    // The Security Rules suite needs a live Firestore emulator, so it runs
    // under its own config rather than in the ordinary unit run.
    // Browser-level coverage runs under Playwright, against the built app.
    exclude: ['**/node_modules/**', '**/dist/**', 'firestore/**', 'e2e/**'],
  },
})
