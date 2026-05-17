# API Testing

**Source**: [Playwright API Testing Docs](https://playwright.dev/docs/api-testing)

---

## Why API Tests in Playwright

- Same runner, same fixtures, same reporting
- Cross-test data setup (faster than UI)
- Verify backend independently of UI
- Hybrid tests: API setup → UI verification

---

## The `request` Fixture

Built-in. No browser launched.

```typescript
import { test, expect } from '@playwright/test';

test('GET /api/users returns list', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.status()).toBe(200);
  const users = await response.json();
  expect(users.length).toBeGreaterThan(0);
});
```

---

## CRUD Examples

```typescript
test('create user via API', async ({ request }) => {
  const res = await request.post('/api/users', {
    data: { name: 'Alice', email: 'alice@example.com' },
  });
  expect(res.ok()).toBe(true);
  const user = await res.json();
  expect(user.id).toBeDefined();
});

test('PATCH user', async ({ request }) => {
  const res = await request.patch(`/api/users/123`, {
    data: { name: 'Alice Updated' },
  });
  expect(res.status()).toBe(200);
});

test('DELETE user', async ({ request }) => {
  const res = await request.delete('/api/users/123');
  expect(res.status()).toBe(204);
});
```

---

## Authenticated Requests

### Per-test token
```typescript
const response = await request.get('/api/me', {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Persisted via storageState
```typescript
// playwright.config.ts
use: {
  storageState: 'playwright/.auth/user.json',
}
```

The `request` context inherits cookies + headers from storageState.

### Login via API for fast auth
```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate via API', async ({ request }) => {
  const res = await request.post('/api/login', {
    data: { email: 'user@example.com', password: 'pass' },
  });
  // Save cookies/tokens
  await request.storageState({ path: 'playwright/.auth/user.json' });
});
```

**This is dramatically faster than UI login, recommended.**

---

## Hybrid: API Setup + UI Verification

```typescript
test('UI shows item created via API', async ({ request, page }) => {
  // Setup via API (fast)
  const res = await request.post('/api/items', {
    data: { name: 'Test Item', price: 9.99 },
  });
  const item = await res.json();

  // Verify in UI
  await page.goto(`/items/${item.id}`);
  await expect(page.getByRole('heading', { name: 'Test Item' })).toBeVisible();
  await expect(page.getByText('$9.99')).toBeVisible();
});
```

---

## API Client as Fixture

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';

type APIClient = {
  createUser: (data: any) => Promise<any>;
  deleteUser: (id: string) => Promise<void>;
};

export const test = base.extend<{ api: APIClient }>({
  api: async ({ request }, use) => {
    await use({
      createUser: async (data) => {
        const res = await request.post('/api/users', { data });
        return res.json();
      },
      deleteUser: async (id) => {
        await request.delete(`/api/users/${id}`);
      },
    });
  },
});
```

---

## Schema Validation

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

test('user response matches schema', async ({ request }) => {
  const res = await request.get('/api/users/123');
  const data = await res.json();
  expect(() => UserSchema.parse(data)).not.toThrow();
});
```

---

## Best Practices

1. **API auth setup beats UI login**, faster, more reliable
2. **Hybrid tests combine speed + coverage**, API setup, UI verification
3. **API client as fixture**, reusable across tests
4. **Schema validation**, catch contract drift
5. **Don't duplicate UI tests as API tests**, pick the right level
6. **Use baseURL**, `request.get('/api/x')` resolves correctly

---

## Anti-Patterns

```typescript
// ❌ BAD: UI login when API exists
await page.goto('/login');
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill(password);
await page.getByRole('button', { name: 'Sign in' }).click();

// ✅ GOOD: API login
await request.post('/api/login', { data: { email, password } });
```

```typescript
// ❌ BAD: Treating API response as truthy
const data = await res.json();
expect(data).toBeTruthy();

// ✅ GOOD: Verify shape
expect(data).toMatchObject({
  id: expect.any(String),
  email: expect.stringMatching(/@/),
});
```
