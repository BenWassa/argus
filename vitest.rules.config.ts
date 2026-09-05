import { defineConfig } from 'vitest/config'

/**
 * The Security Rules suite. Separate from the app suite because it needs the
 * Firestore emulator running; `npm run test:rules` starts one around it.
 */
export default defineConfig({
  test: {
    include: ['firestore/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
