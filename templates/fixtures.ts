/**
 * Custom test fixtures.
 *
 * Always import `test` and `expect` from this file in test specs,
 * NOT from `@playwright/test` directly.
 *
 * Source: https://playwright.dev/docs/test-fixtures
 */

import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';
// import { CartPage } from './pages/cart-page';
// import { CheckoutPage } from './pages/checkout-page';

type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  // cartPage: CartPage;
  // checkoutPage: CheckoutPage;
};

type WorkerFixtures = {
  // Worker-scoped fixtures, e.g., per-worker accounts
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  // Example with setup/teardown:
  // cartPage: async ({ page }, use) => {
  //   const cartPage = new CartPage(page);
  //   await cartPage.goto();
  //   await use(cartPage);
  //   await cartPage.empty();  // teardown
  // },
});

export { expect };
