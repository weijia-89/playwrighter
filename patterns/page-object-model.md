# Page Object Model

**Source**: [Playwright POM Docs](https://playwright.dev/docs/pom)

---

## Concept

A Page Object class encapsulates the locators and actions for one page (or page section) of your app.

**Goal:** Tests describe *what* to do; Page Objects describe *how* to do it.

---

## Modern Pattern (Playwright-native POM)

```typescript
// tests/pages/login-page.ts
import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign In' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(text: string) {
    await expect(this.errorMessage).toContainText(text);
  }
}
```

---

## Use in Tests

### Plain instantiation
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';

test('[TC-001] valid login redirects to dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'TestPass123!');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Better: as a Fixture (recommended)
See [fixtures.md](./fixtures.md). Combining POM + fixtures = cleanest tests.

```typescript
import { test, expect } from './fixtures';  // your custom fixtures

test('[TC-001] valid login', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login('user@example.com', 'TestPass123!');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

---

## Rules

### DO
- **Store locators as `readonly Locator`**, not strings, not functions
- **Use accessible locators**, `getByRole`, `getByLabel`, `getByText`
- **Action methods**, `login()`, `submitOrder()`, `addToCart()`
- **Return new POM** when an action navigates, `await checkoutPage.confirm()` returns `OrderConfirmationPage`
- **Sanity assertions** are OK during navigation (e.g., `expect(this.heading).toBeVisible()` after `goto()`)

### DON'T
- **Don't put test assertions inside POM**, assertions live in tests, except for navigation sanity checks
- **Don't use string locators**, `'button.submit'` defeats type safety
- **Don't expose `page`** unnecessarily, encapsulate
- **Don't put business logic**, POM models the *page*, not the workflow
- **Don't make god-class POMs**, split by page section if it gets large

---

## Composition Patterns

### Sub-components for shared regions
```typescript
// pages/components/nav-bar.ts
export class NavBar {
  constructor(private page: Page) {}

  readonly userMenu = this.page.getByLabel('User menu');
  readonly logoutLink = this.page.getByRole('link', { name: 'Log out' });

  async logout() {
    await this.userMenu.click();
    await this.logoutLink.click();
  }
}

// pages/dashboard-page.ts
export class DashboardPage {
  readonly nav: NavBar;
  constructor(public readonly page: Page) {
    this.nav = new NavBar(page);
  }
}
```

### Page transitions
```typescript
async submitOrder(): Promise<OrderConfirmationPage> {
  await this.confirmButton.click();
  const confirmation = new OrderConfirmationPage(this.page);
  await expect(confirmation.heading).toBeVisible();
  return confirmation;
}
```

---

## Folder Structure

```
tests/
├── pages/
│   ├── components/
│   │   ├── nav-bar.ts
│   │   └── footer.ts
│   ├── login-page.ts
│   ├── dashboard-page.ts
│   └── checkout-page.ts
├── fixtures.ts
└── specs/
    ├── login.spec.ts
    └── checkout.spec.ts
```

---

## Anti-Patterns

```typescript
// ❌ BAD: String locators
class BadLoginPage {
  emailSelector = '#email';
  async login(email: string) {
    await this.page.fill(this.emailSelector, email);  // No auto-wait, no type safety
  }
}

// ✅ GOOD: Locator objects
class LoginPage {
  emailInput = this.page.getByLabel('Email');
  async login(email: string) {
    await this.emailInput.fill(email);  // Auto-waits, type-safe
  }
}
```

```typescript
// ❌ BAD: Test assertions in POM (couples POM to test intent)
async login() {
  await this.submitButton.click();
  await expect(this.page).toHaveURL(/dashboard/);  // Don't put this in POM
}

// ✅ GOOD: Assertions in test
// In POM:
async login() { await this.submitButton.click(); }
// In test:
await loginPage.login();
await expect(page).toHaveURL(/dashboard/);
```
