import { defineConfig, devices } from '@playwright/test'

/**
 * Browser coverage for what JSDOM cannot prove: that a real pointer, on a real
 * compositor, at the sizes this app is actually used at, never puts a future
 * answer on screen and never grades a card twice.
 *
 * The viewports are the ones the issue names — the smallest phone still
 * supported, a current phone, short landscape, and a desktop pointer.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/argus/',
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
    command: 'npm run build && npx vite preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/argus/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
