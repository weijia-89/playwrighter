/**
 * Recommended Playwright configuration.
 *
 * Source: https://playwright.dev/docs/test-configuration
 *
 * Highlights:
 * - fullyParallel for max speed
 * - forbidOnly on CI to catch stray .only()
 * - retries only on CI
 * - trace on-first-retry (cheap + useful)
 * - screenshot/video only on failure
 * - blob reporter on CI for sharding
 * - setup project for auth state reuse
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',

  // Run tests in parallel within files (and across files via workers)
  fullyParallel: true,

  // Catch leftover .only() on CI
  forbidOnly: isCI,

  // Retry on CI only
  retries: isCI ? 2 : 0,

  // Workers: more on local, capped on CI
  workers: isCI ? 4 : undefined,

  // Reporters
  reporter: isCI
    ? [['blob'], ['github'], ['html', { open: 'never' }]]
    : 'html',

  // Output dirs
  outputDir: 'test-results',

  // Shared options for all projects
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Trace only on retry (cheap + useful for debugging flakes)
    trace: 'on-first-retry',

    // Capture screenshot/video on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Per-action timeouts
    actionTimeout: 10_000,
    navigationTimeout: 30_000,

    // Disable animations for visual stability
    // (override per-test with test.use({ launchOptions: { ... } }))
  },

  // Test-level expect timeout
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      animations: 'disabled',
    },
  },

  // Browsers + setup project
  projects: [
    // Setup project: runs auth setup before tests
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Auto-start dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
