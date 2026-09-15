import { defineConfig, devices } from '@playwright/test'

/**
 * Browser coverage for the production bundle. The explicit test-auth UID keeps
 * existing interaction suites deterministic without weakening production auth;
 * the bundle uses a per-UID local test cloud only when this flag is present.
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
    command: 'VITE_ARGUS_TEST_AUTH_UID=argus-e2e-user npm run build && npx vite preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/argus/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
