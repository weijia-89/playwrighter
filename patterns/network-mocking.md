# Network Mocking

**Source**: [Playwright Mock APIs Docs](https://playwright.dev/docs/mock), [Network Docs](https://playwright.dev/docs/network)

---

## When to Mock

| Scenario | Mock? |
|----------|-------|
| Testing your own UI behavior with known data | ✅ Yes |
| Third-party APIs (analytics, payments, maps) | ✅ Always |
| Slow/flaky backend dependencies | ✅ Yes |
| Edge cases (errors, empty states, large data) | ✅ Yes |
| End-to-end smoke tests against staging | ❌ No |
| Backend integration tests | ❌ No |

**Rule:** Don't test what you don't control.

---

## Full Mock (No Real Request)

Intercept the call and return canned data. The real API is never hit.

```typescript
test('shows products from mocked API', async ({ page }) => {
  await page.route('**/api/products', async route => {
    await route.fulfill({
      json: [
        { id: 1, name: 'Widget', price: 9.99 },
        { id: 2, name: 'Gadget', price: 19.99 },
      ],
    });
  });

  await page.goto('/products');
  await expect(page.getByText('Widget')).toBeVisible();
  await expect(page.getByText('$9.99')).toBeVisible();
});
```

**Note:** For requests made on initial page load, set up the route **before** `page.goto()`. Routes set up later still apply to subsequent requests, but won't catch the first navigation.

---

## Modify Real Response

Make the request normally, then patch the response.

```typescript
test('adds extra item to API list', async ({ page }) => {
  await page.route('**/api/fruits', async route => {
    const response = await route.fetch();
    const json = await response.json();
    json.push({ name: 'Loquat', id: 100 });
    await route.fulfill({ response, json });
  });

  await page.goto('/fruits');
  await expect(page.getByText('Loquat')).toBeVisible();
});
```

---

## Status Codes & Errors

```typescript
// Simulate 500 error
await page.route('**/api/checkout', async route => {
  await route.fulfill({
    status: 500,
    json: { error: 'Server error' },
  });
});

// Simulate network failure
await page.route('**/api/slow', async route => {
  await route.abort();  // or 'failed', 'timedout'
});

// Add delay
await page.route('**/api/data', async route => {
  await new Promise(r => setTimeout(r, 2000));
  await route.continue();
});
```

---

## Conditional Routing

Inspect the request and decide per-call:

```typescript
await page.route('**/api/**', async (route, request) => {
  const url = request.url();

  if (url.includes('/users')) {
    await route.fulfill({ json: USERS_FIXTURE });
  } else if (url.includes('/orders') && request.method() === 'POST') {
    await route.fulfill({ status: 500 });
  } else {
    await route.continue();  // pass through everything else
  }
});
```

---

## Context-Level Mocks (Shared Across Pages)

```typescript
test.beforeEach(async ({ context }) => {
  // Apply to all pages in this test's context
  await context.route('**/analytics/**', route => route.abort());
});
```

---

## HAR Replay (Record Once, Replay Forever)

### Record
```typescript
test('record', async ({ page }) => {
  await page.routeFromHAR('hars/products.har', {
    url: '**/api/**',
    update: true, // populate the HAR file
  });
  await page.goto('/products');
});
```

Run once with `update: true`, commit `hars/products.har`, then:

### Replay
```typescript
test('replay', async ({ page }) => {
  await page.routeFromHAR('hars/products.har', {
    url: '**/api/**',
    // update: false (default), replay from file
  });
  await page.goto('/products');
});
```

---

## Mocking as Fixtures

For repeated mocks, wrap in a fixture:

```typescript
// fixtures.ts
export const test = base.extend({
  mockProducts: async ({ page }, use) => {
    await page.route('**/api/products', async route => {
      await route.fulfill({ json: PRODUCTS_FIXTURE });
    });
    await use();
  },
});

// In a test
test('uses mocked products', async ({ page, mockProducts }) => {
  await page.goto('/products');
  // Mock is active for this test
});
```

---

## Removing Mocks Mid-Test

```typescript
const handler = async (route) => route.fulfill({ status: 500 });
await page.route('**/api/orders', handler);
// ... actions ...
await page.unroute('**/api/orders', handler);
```

---

## WebSocket Mocking

```typescript
await page.routeWebSocket('wss://example.com/socket', ws => {
  ws.onMessage(message => {
    // Echo back or transform
    ws.send(`Echo: ${message}`);
  });
});
```

---

## Best Practices

1. **Mock third-party services always**, don't depend on what you can't control
2. **Centralize fixtures**, one `tests/mocks/` folder with reusable JSON
3. **Type your mocks**, use shared types between app and tests
4. **Mock at the lowest level you can**, usually the API boundary, not internal modules
5. **Verify mocks were called**, assertions on `route.request()` if behavior depends on it
6. **Use HAR for snapshot replay**, when you don't want to maintain JSON by hand

---

## Anti-Patterns

```typescript
// ❌ BAD: Mocking after navigation (race condition)
await page.goto('/products');
await page.route('**/api/products', ...);  // Too late!

// ✅ GOOD: Mock first
await page.route('**/api/products', ...);
await page.goto('/products');
```

```typescript
// ❌ BAD: Mocking internal app modules
await page.evaluate(() => { window.api.getProducts = () => [...] });

// ✅ GOOD: Mock at network boundary
await page.route('**/api/products', ...);
```
