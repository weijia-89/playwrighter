# Test Data Strategy

**Sources**: [Faker.js](https://fakerjs.dev/), Playwright fixtures, community patterns

The data your tests use determines whether they're reliable, parallel-safe, and maintainable.

---

## Three Data Categories

| Category | Source | Example |
|----------|--------|---------|
| **Fixed** | Constants in code or JSON | Test card `4242 4242 4242 4242` |
| **Generated** | Faker per-test | Random email/name/address |
| **Seeded** | Backend pre-seeded | Known users with specific permissions |

---

## Faker for Per-Test Uniqueness

```bash
npm i -D @faker-js/faker
```

```typescript
import { faker } from '@faker-js/faker';

test('register new user', async ({ page }) => {
  // Each test run gets a unique email, no collisions in parallel
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 16 });

  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(page.getByText(`Welcome, ${email}`)).toBeVisible();
});
```

---

## Factory Pattern (Recommended)

Encapsulate data shapes in factories. Defaults + overrides.

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export type User = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'guest';
};

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    email: faker.internet.email(),
    password: faker.internet.password({ length: 16 }),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'user',
    ...overrides,
  };
}

export function makeAdmin(overrides: Partial<User> = {}): User {
  return makeUser({ role: 'admin', ...overrides });
}
```

Use:
```typescript
// Inline login (or extract to a helper / fixture)
async function loginAs(page: Page, user: User) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
}

test('admin sees admin panel', async ({ page, request }) => {
  const admin = makeAdmin();
  await request.post('/api/users', { data: admin });
  await loginAs(page, admin);
  await expect(page.getByRole('link', { name: 'Admin Panel' })).toBeVisible();
});
```

---

## Per-Worker Unique Data

Use `testInfo.workerIndex` (or `parallelIndex`) to guarantee uniqueness across parallel workers.

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';
import { makeUser, type User } from './factories/user.factory';

export const test = base.extend<{}, { workerUser: User }>({
  workerUser: [async ({}, use, workerInfo) => {
    const user = makeUser({
      email: `worker-${workerInfo.workerIndex}-${Date.now()}@test.example.com`,
    });
    // Provision via API
    // ...
    await use(user);
    // Cleanup
  }, { scope: 'worker' }],
});
```

---

## Static Test Data (JSON)

For fixed reference data that doesn't change per run:

```json
// tests/fixtures/products.json
[
  { "id": "prd_001", "name": "Widget", "price": 9.99 },
  { "id": "prd_002", "name": "Gadget", "price": 19.99 }
]
```

```typescript
import products from '../fixtures/products.json';

test('lists products', async ({ page }) => {
  await page.route('**/api/products', route =>
    route.fulfill({ json: products })
  );
  await page.goto('/products');
  await expect(page.getByText('Widget')).toBeVisible();
});
```

---

## Faker Locale & Seeding

```typescript
import { faker } from '@faker-js/faker';

// Locale-aware data
faker.setLocale('fr');
const frenchName = faker.person.fullName();  // "Jean Dupont"

// Seed for reproducible runs (debugging only, defeats randomization)
faker.seed(42);
const sameEvery = faker.internet.email();
```

---

## Sensitive Test Data

Never use real PII or production-like data:

```typescript
// ✅ Faker, fake but realistic
const email = faker.internet.email();
const phone = faker.phone.number();

// ❌ Real data
const email = 'real.person@actualcompany.com';
```

For payment cards, use **test card numbers** from your payment provider:
- Stripe: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (declined)
- PayPal Sandbox: see their docs

---

## Cleanup Strategy

### Automatic via fixture teardown
```typescript
testUser: async ({ request }, use) => {
  const user = makeUser();
  await request.post('/api/users', { data: user });
  await use(user);
  // Teardown after test
  await request.delete(`/api/users/${user.email}`);
},
```

### Bulk cleanup at end of run
```typescript
// global-teardown.ts
import { request } from '@playwright/test';
export default async function globalTeardown() {
  const ctx = await request.newContext();
  await ctx.delete('/api/test-users/cleanup-by-prefix?prefix=worker-');
}
```

`playwright.config.ts`:
```typescript
export default defineConfig({
  globalTeardown: require.resolve('./global-teardown.ts'),
});
```

---

## Data Strategy Decision Tree

```
Does the test mutate state?
├─ NO  → Static JSON or Faker (no cleanup needed)
└─ YES → Does it need a real backend record?
         ├─ NO  → Mock with page.route()
         └─ YES → Factory + per-worker fixture + cleanup
```

---

## Best Practices

1. **Faker for unique-per-test data**, emails, names, IDs
2. **Factory functions**, defaults + overrides
3. **Per-worker for state-mutating tests**, avoid race conditions
4. **API-create test data**, much faster than UI signup
5. **Use known test cards/credentials**, not real ones
6. **Tag test data with prefix**, `worker-*@test.example.com` makes cleanup easy
7. **Auto-cleanup via fixtures**, `await use()` pattern
8. **Static JSON for read-only fixtures**, products, mock APIs

---

## Anti-Patterns

```typescript
// ❌ Hardcoded email, collisions in parallel
const email = 'test@example.com';
await page.fill('[name=email]', email);

// ✅ Faker
const email = faker.internet.email();
```

```typescript
// ❌ Date.now() alone, workers can collide on same millisecond
const id = `user-${Date.now()}`;

// ✅ Worker index + timestamp + random
const id = `user-${workerInfo.workerIndex}-${Date.now()}-${faker.string.alpha(4)}`;
```

```typescript
// ❌ Real PII in test data
const user = { ssn: '123-45-6789', cc: '4111111111111111' };

// ✅ Faker / test cards
const user = { ssn: faker.string.numeric(9), cc: '4242 4242 4242 4242' };
```

```typescript
// ❌ No cleanup
test('creates user', async ({ request }) => {
  await request.post('/api/users', { data: makeUser() });
  // ... DB fills with thousands of test users over time
});

// ✅ Cleanup in teardown
test('creates user', async ({ request, testUser }) => {
  // testUser fixture handles cleanup
});
```
