# Authentication Patterns

**Source**: QualityForge, MC QA Tools login-strategies.md  
**Confidence**: 95%

---

## Strategy Priority

1. **Reuse auth state** (fastest, most reliable)
2. **Per-test login** (for isolated tests)
3. **Cookie import** (for real session reuse)
4. **Manual login in headed mode** (for SSO/complex auth)

---

## 1. Reuse Authentication State (RECOMMENDED)

### Global Setup

```typescript
// File: auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for authentication to complete
  await page.waitForURL('**/dashboard');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

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
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

**.gitignore**:
```
.auth/
```

---

## 2. Per-Test Login (For Isolation)

```typescript
// ✅ GOOD: Login in beforeEach for isolated tests
test.describe('Authenticated Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
  });

  test('[TC-001] User can access settings', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/.*settings/);
  });
});
```

---

## 3. Extract Login Helper

```typescript
// File: helpers/auth.ts
import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard');
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'User menu' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/.*login/);
}

// Use in tests
import { login, logout } from './helpers/auth';

test('[TC-001] Login flow', async ({ page }) => {
  await login(page, 'test@example.com', 'Password123!');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

---

## 4. Environment Variables for Credentials

```typescript
// .env.example
BASE_URL=http://localhost:5173
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Password123!
```

```typescript
// playwright.config.ts
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
  },
});
```

```typescript
// Use in tests
const email = process.env.TEST_USER_EMAIL || 'test@example.com';
const password = process.env.TEST_USER_PASSWORD || 'Password123!';

await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill(password);
```

**.gitignore**:
```
.env
.auth/
```

---

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use .env files** (gitignored)
3. **Use dedicated test accounts** (not production)
4. **Store auth state in .auth/** (gitignored)
5. **Document required credentials** in README

---

## Login Testing

```typescript
// ✅ Test login itself
test.describe('Authentication', () => {
  test('[TC-001] Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('[TC-002] Login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
});
```

---

## Summary

- **Reuse auth state** for fast test execution
- **Extract login helpers** to avoid duplication
- **Use environment variables** for credentials
- **Never commit** `.env` or `.auth/` files
- **Document credentials** required in README
