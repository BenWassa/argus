import { defineConfig, devices } from '@playwright/test'

/**
 * Browser coverage for what JSDOM cannot prove: that a real pointer, on a real
 * compositor, at the sizes this app is actually used at, never puts a future
 * answer on screen and never grades a card twice.
 *
 * The viewports are the ones the issue names — the smallest phone still
 * supported, a current phone, short landscape, and a desktop pointer.
 */
// Another local project's preview server on the default port would otherwise be
// silently reused (`reuseExistingServer`) and tested in Argus's place.
const port = Number(process.env.ARGUS_E2E_PORT ?? 4173)
const origin = `http://127.0.0.1:${port}/`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: origin,
    trace: 'on-first-retry',
    // CI installs the browser Playwright asks for. Sandboxes that already ship
    // a Chromium can point at it instead of downloading a second one.
    launchOptions: process.env.ARGUS_CHROMIUM
      ? { executablePath: process.env.ARGUS_CHROMIUM }
      : undefined,
  },
  projects: [
    {
      name: 'phone-320',
      use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 568 }, hasTouch: true },
    },
    {
      name: 'phone-390',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
    {
      name: 'landscape-short',
      use: { ...devices['Desktop Chrome'], viewport: { width: 740, height: 360 }, hasTouch: true },
    },
    {
      name: 'desktop-pointer',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    // The production bundle, not the dev server: this is the artifact that ships.
    //
    // Built without Firebase configuration. These tests cannot sign in to
    // Google, and the entry boundary (#93 §1) is only raised for a build that
    // has an account to sign in to — so this is the same app, exercised in the
    // local-only configuration the repository has always supported, rather than
    // the gate being disabled by a test-only flag. The gate itself is covered
    // in `src/app/gate/AuthGate.test.tsx`.
    command: `npm run build:e2e && npx vite preview --port ${port} --strictPort --host 127.0.0.1`,
    url: origin,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
