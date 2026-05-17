/**
 * Dashboard page object.
 *
 * Example of a post-login page with navigation + actions.
 */

import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly userMenu: Locator;
  readonly logoutLink: Locator;
  readonly navProducts: Locator;
  readonly navSettings: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /welcome|dashboard/i });
    this.userMenu = page.getByLabel('User menu');
    this.logoutLink = page.getByRole('menuitem', { name: 'Log out' });
    this.navProducts = page.getByRole('link', { name: 'Products' });
    this.navSettings = page.getByRole('link', { name: 'Settings' });
  }

  async goto() {
    await this.page.goto('/dashboard');
    await expect(this.heading).toBeVisible();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutLink.click();
  }

  async openSettings() {
    await this.navSettings.click();
  }
}
