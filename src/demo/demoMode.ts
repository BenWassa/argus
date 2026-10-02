/**
 * Demo mode: the build that can be embedded in somebody else's page.
 *
 * It is a property of the *build*, never of the URL. A production visitor must
 * not be able to flip a real library into a throwaway one with `?mode=demo`, and
 * a demo visitor must not be able to flip a sample library into a real one. The
 * switch is `VITE_ARGUS_DEMO`, set only by `npm run build:demo`.
 *
 * A demo build is entirely local: no sign-in, no sync, no inbox, no service
 * worker, and nothing it does is written to storage. Reloading returns it to the
 * same sample library. That last property is the point: the demo is hosted on a
 * domain other visitors share, so it must neither keep a previous visitor's
 * progress nor ever read or overwrite a real library that happens to sit under
 * the same origin.
 */
type Env = Record<string, unknown>

/** `true` and `1`, in any case. A near-miss like `TRUE` must not silently fail. */
export function readDemoMode(env: Env): boolean {
  const value = env.VITE_ARGUS_DEMO
  return typeof value === 'string' && ['true', '1'].includes(value.trim().toLowerCase())
}

/** Read at call time, not import time, so a test can stub the environment. */
export function isDemoBuild(): boolean {
  return readDemoMode(import.meta.env as unknown as Env)
}
