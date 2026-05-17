/**
 * Authentication setup project.
 *
 * Runs once before all tests. Saves authenticated state to
 * playwright/.auth/user.json for reuse via storageState.
 *
 * Source: https://playwright.dev/docs/auth
 *
 * Configure in playwright.config.ts:
 *   { name: 'setup', testMatch: /.*\.setup\.ts/ }
 *   then declare `dependencies: ['setup']` on browser projects
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Perform login flow. Replace with your app's auth steps.
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL || 'user@example.com');
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'TestPass123!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for post-login state. Pick ONE based on your auth flow:
  //
  //   Redirect-based auth → use waitForURL:
  //     await page.waitForURL('**/dashboard');
  //
  //   Token-based auth (no redirect) → assert signed-in element:
  //     await expect(page.getByTestId('user-menu')).toBeVisible();
  //
  // For most apps, waitForURL is sufficient and faster.
  await page.waitForURL('**/dashboard');

  // Save auth state for reuse. Playwright creates the directory automatically.
  await page.context().storageState({ path: authFile });
});

// Optional: multiple roles
// const adminFile = path.join(__dirname, '../playwright/.auth/admin.json');
// setup('authenticate as admin', async ({ page }) => {
//   await page.goto('/login');
//   await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL!);
//   await page.getByLabel('Password').fill(process.env.ADMIN_PASSWORD!);
//   await page.getByRole('button', { name: 'Sign in' }).click();
//   await page.waitForURL('**/admin');
//   await page.context().storageState({ path: adminFile });
// });
