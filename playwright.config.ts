import { defineConfig, devices } from '@playwright/test'

/**
 * Minimal Playwright config — runs against `vite preview` on CI/locally.
 *
 * E2E requires a reachable PocketBase at VITE_PB_URL. Tests that need a
 * backend are marked `.describe.serial()` and skip if `E2E_PB_URL` is unset,
 * so contributors without a local PB can still run the suite.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
})
