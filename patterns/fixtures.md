# Fixtures

**Source**: [Playwright Fixtures Docs](https://playwright.dev/docs/test-fixtures)

---

## Why Fixtures (Not beforeEach/afterEach)

Fixtures are Playwright's primary mechanism for test setup. They beat hooks because:

1. **Setup + teardown in one place**, no split logic across `beforeEach`/`afterEach`
2. **Reusable**, define once, use across files
3. **On-demand**, only fixtures referenced by a test run for that test
4. **Composable**, fixtures can depend on other fixtures
5. **Per-test isolation**, each test gets a fresh fixture instance by default
6. **No `describe()` wrapping for setup**, group tests by meaning, not by setup

---

## Basic Custom Fixture

```typescript
// tests/fixtures.ts
import { test as base } from '@playwright/test';
import { TodoPage } from './pages/todo-page';

type Fixtures = {
  todoPage: TodoPage;
};

export const test = base.extend<Fixtures>({
  todoPage: async ({ page }, use) => {
    // Setup
    const todoPage = new TodoPage(page);
    await todoPage.goto();

    // Provide to test
    await use(todoPage);

    // Teardown
    await todoPage.removeAll();
  },
});

export { expect } from '@playwright/test';
```

```typescript
// tests/todo.spec.ts
import { test, expect } from './fixtures';

test('[TC-001] adds an item', async ({ todoPage }) => {
  await todoPage.addItem('buy milk');
  await expect(todoPage.items).toHaveText(['buy milk']);
});
```

---

## Fixture Scopes

### Test-scoped (default)
Runs once per test. Use for state isolated to a single test.

```typescript
loggedInPage: async ({ page }, use) => {
  await login(page);
  await use(page);
}
```

### Worker-scoped
Runs once per worker process; shared across tests in that worker. Use for expensive setup.

```typescript
export const test = base.extend<{}, { apiClient: APIClient }>({
  apiClient: [async ({}, use) => {
    const client = await createAPIClient();
    await use(client);
    await client.close();
  }, { scope: 'worker' }],
});
```

**Note the tuple syntax**, the second template parameter declares worker fixtures.

### Auto fixtures
Run for every test even when not explicitly requested. Use sparingly.

```typescript
autoLogger: [async ({}, use, testInfo) => {
  console.log(`Starting: ${testInfo.title}`);
  await use();
}, { auto: true }],
```

---

## Composing Fixtures (POM Pattern)

```typescript
// tests/fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page, loginPage }, use) => {
    // Depends on loginPage, Playwright resolves order
    await loginPage.goto();
    await loginPage.login('user@example.com', 'pass');
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
```

---

## Worker-Scoped Account Fixture

For tests that mutate server state, give each worker its own account.

```typescript
// tests/fixtures.ts
import { test as base } from '@playwright/test';

type WorkerFixtures = {
  account: { username: string; password: string };
};

export const test = base.extend<{}, WorkerFixtures>({
  account: [async ({ browser }, use, workerInfo) => {
    const username = `user_${workerInfo.workerIndex}_${Date.now()}`;
    const password = 'TestPass123!';

    // Create account via API (faster than UI).
    // Replace this with your app's account-creation endpoint.
    const ctx = await browser.newContext();
    const apiContext = ctx.request;
    await apiContext.post('/api/users', {
      data: { username, password },
    });
    await ctx.close();

    await use({ username, password });

    // Cleanup: delete account via API (implement based on your backend)
  }, { scope: 'worker' }],
});

export { expect } from '@playwright/test';
```

---

## Override Built-in Fixtures

You can override `page`, `context`, etc.

```typescript
export const test = base.extend({
  page: async ({ page, account }, use) => {
    // Sign in before every test
    await page.goto('/login');
    await page.getByLabel('Username').fill(account.username);
    await page.getByLabel('Password').fill(account.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByTestId('user-menu')).toBeVisible();

    await use(page);
  },
});
```

---

## Fixture Options

Pass configuration to fixtures via `test.use()`.

```typescript
type Options = { defaultLocale: string };

export const test = base.extend<Options>({
  defaultLocale: ['en-US', { option: true }],
  page: async ({ page, defaultLocale }, use) => {
    await page.goto(`/?lang=${defaultLocale}`);
    await use(page);
  },
});

// In a test file
test.use({ defaultLocale: 'de-DE' });
test('shows German', async ({ page }) => { /* ... */ });
```

---

## Best Practices

1. **One file for fixtures**, `tests/fixtures.ts` exporting custom `test` and `expect`
2. **Always import from your fixtures file**, never directly from `@playwright/test` in test files
3. **Worker-scoped for expensive ops**, DB connections, account creation
4. **Use teardown**, clean up data created in setup via `await use()` pattern
5. **Compose, don't duplicate**, fixtures can depend on other fixtures
6. **Type your fixtures**, use TypeScript generics for autocomplete

---

## Anti-Patterns

```typescript
// ❌ BAD: Setup in beforeEach when you could use fixture
test.beforeEach(async ({ page }) => {
  const todoPage = new TodoPage(page);
  await todoPage.goto();
  // ...
});

// ✅ GOOD: Fixture
todoPage: async ({ page }, use) => {
  const p = new TodoPage(page);
  await p.goto();
  await use(p);
}
```

```typescript
// ❌ BAD: Returning a value without `use()`
myFixture: async ({}, use) => {
  return new Thing();  // Won't work
}

// ✅ GOOD: Use `await use(value)`
myFixture: async ({}, use) => {
  await use(new Thing());
}
```
