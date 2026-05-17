# Authentication Patterns

**Source**: [Playwright Auth Docs](https://playwright.dev/docs/auth)

---

## Four Tiers of Auth Strategy

| Tier | Approach | When to use |
|------|----------|-------------|
| **1. Shared account** | One auth state, all tests | Tests don't mutate server state |
| **2. Per-worker account** | Worker-scoped fixture | Tests mutate state; need isolation |
| **3. Multiple roles** | Per-role storageState | Admin / user / guest scenarios |
| **4. API-based auth** | Skip UI, hit auth endpoint | Fastest; recommended when API exists |

---

## Tier 1: Shared Account (RECOMMENDED for read-only tests)

### Setup project

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for post-login state
  await page.waitForURL('**/dashboard');
  await expect(page.getByTestId('user-menu')).toBeVisible();

  // Persist auth state
  await page.context().storageState({ path: authFile });
});
```

**Note:** Canonical path is `playwright/.auth/` (per official docs).

### Configure in playwright.config.ts

```typescript
export default defineConfig({
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    
    // Tests use setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

**.gitignore**:
```
playwright/.auth/
.env
```

---

## Tier 2: Per-Worker Account (for state-mutating tests)

When tests modify shared server state, give each worker its own account.

```typescript
// tests/fixtures.ts
import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export * from '@playwright/test';

export const test = baseTest.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [async ({ browser }, use) => {
    const id = test.info().parallelIndex;
    const fileName = path.resolve(
      test.info().project.outputDir,
      `.auth/${id}.json`
    );

    if (fs.existsSync(fileName)) {
      await use(fileName);
      return;
    }

    const page = await browser.newPage({ storageState: undefined });
    // Acquire a unique account for this worker. Implement based on your backend:
    // - Create-on-demand via your API
    // - Pull from a pre-seeded pool keyed by worker index
    const account = await acquireAccount(id);

    await page.goto('/login');
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password').fill(account.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByTestId('user-menu')).toBeVisible();

    await page.context().storageState({ path: fileName });
    await page.close();
    await use(fileName);
  }, { scope: 'worker' }],
});
```

---

## Tier 3: Multiple Roles

For admin/user/guest scenarios, save one storageState per role.

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

setup('admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});

setup('user', async ({ page }) => {
  // ... similar for user
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

Use per-test or per-describe:
```typescript
import { test } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });
test('admin can delete users', async ({ page }) => { /* */ });

test.describe('User-only views', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });
  test('user sees own profile', async ({ page }) => { /* */ });
});
```

---

## Tier 4: API-Based Authentication (FASTEST)

Skip the UI entirely. Use the `request` context to hit your auth endpoint.

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate via API', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: {
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    },
  });
  expect(response.ok()).toBe(true);

  // request context now holds auth cookies
  await request.storageState({ path: 'playwright/.auth/user.json' });
});
```

**Why prefer API auth when feasible:**
- 5-10x faster than UI login
- More reliable (no UI race conditions)
- Decouples test setup from login UI changes

**Limits:** SSO/OAuth flows may not work this way.

**For OAuth, SSO/SAML, MFA, or magic-link auth:** see [`oauth-mfa-sso.md`](./oauth-mfa-sso.md) for detailed patterns.

---

## Environment Variables

```bash
# .env (gitignored)
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPass123!
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass123!
```

```typescript
// playwright.config.ts
import * as dotenv from 'dotenv';
dotenv.config();
```

---

## Security Best Practices

1. **Never commit credentials**, use `.env` (gitignored)
2. **Never commit `playwright/.auth/`**, contains live session cookies
3. **Use dedicated test accounts**, not production users
4. **Use per-environment secrets** in CI (GitHub secrets, Vault, etc.)
5. **Rotate test credentials** periodically
6. **Document required env vars** in README

---

## Testing the Login Flow Itself

The login flow is one feature you DON'T want auto-authenticated for.

```typescript
import { test, expect } from '@playwright/test';

// Skip storageState for this file
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login feature', () => {
  test('[TC-001] valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('TestPass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('[TC-002] invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });
});
```

---

## Decision Tree

```
Do your tests modify server state?
├─ NO  → Tier 1: Shared account (one storageState)
└─ YES → Do you need multiple roles?
         ├─ NO  → Tier 2: Per-worker account fixture
         └─ YES → Tier 3: Per-role storageState files

Is your auth API-accessible (no SSO)?
└─ YES → Combine with Tier 4: API-based setup for speed
```
