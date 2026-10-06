import { test, expect } from '@playwright/test';

test('matcherless', async ({ page }) => {
  await expect(page.getByRole('heading'));
});

test('wait', async ({ page }) => {
  await page.waitForTimeout(500);
  await expect(page).toHaveTitle('x');
});

test('idle', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle('x');
});

test('forced', async ({ page }) => {
  await page.getByRole('button').click({ force: true });
  await expect(page).toHaveTitle('x');
});

test.only('focused', async ({ page }) => {
  await expect(page).toHaveTitle('x');
});

test.fixme('placeholder', () => {});
