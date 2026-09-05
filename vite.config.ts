import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/argus/',
  test: {
    // The Security Rules suite needs a live Firestore emulator, so it runs
    // under its own config rather than in the ordinary unit run.
    exclude: ['**/node_modules/**', '**/dist/**', 'firestore/**'],
  },
})
