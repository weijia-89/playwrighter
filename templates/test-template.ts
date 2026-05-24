/**
 * Test file template.
 *
 * Conventions:
 * - Test ID: [TC-XXX]
 * - Tags: @P0/@P1/@P2/@P3 + @smoke/@regression/@critical
 * - Arrange-Act-Assert structure
 * - Web-first assertions (await expect(...))
 * - Use custom fixtures (./fixtures), not raw @playwright/test
 */

import { test, expect } from './fixtures';

test.describe('Feature: User Authentication', () => {
  test('[TC-001] Valid credentials redirect to dashboard @P0 @smoke', async ({
    page,
    loginPage,
  }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login('user@example.com', 'TestPass123!');

    // Assert
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible();
  });

  test('[TC-002] Invalid password shows error @P1 @regression', async ({
    loginPage,
  }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login('user@example.com', 'wrong-password');

    // Assert
    await expect(loginPage.errorMessageLocator()).toContainText(/invalid/i);
  });

  test('[TC-003] Logout returns to login page @P1', async ({
    page,
    loginPage,
    dashboardPage,
  }) => {
    await test.step('Log in', async () => {
      await loginPage.goto();
      await loginPage.login('user@example.com', 'TestPass123!');
      await expect(dashboardPage.heading).toBeVisible();
    });

    await test.step('Log out', async () => {
      await dashboardPage.logout();
    });

    await expect(page).toHaveURL(/.*login/);
  });
});
