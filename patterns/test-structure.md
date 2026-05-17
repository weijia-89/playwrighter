# Test Structure

**Source**: Playwright official docs, community conventions

---

## Naming Convention

### Test ID format
```
[TC-XXX] Brief description @priority @tag
```

Example:
```typescript
test('[TC-042] Logged-in user can add item to cart @P1 @smoke', async ({ page }) => {
  // ...
});
```

### Why this format
- **Test ID** (`TC-042`), links to test management / requirements
- **Description**, human-readable
- **Priority tag**, `@P0`, `@P1`, `@P2`, `@P3`
- **Category tag**, `@smoke`, `@regression`, `@critical`, `@a11y`

### File naming
- `*.spec.ts`, preferred for end-to-end specs
- `*.test.ts`, also accepted; pick one and stick with it
- `*.setup.ts`, auth or data setup projects

---

## Folder Layout (Recommended)

```
tests/
├── pages/                    # Page Objects
│   ├── components/
│   ├── login-page.ts
│   └── dashboard-page.ts
├── fixtures.ts               # Custom test fixtures
├── auth.setup.ts             # Authentication setup
├── mocks/                    # Reusable mock JSON
│   └── products.json
├── helpers/                  # Pure utility functions
│   └── api-client.ts
└── specs/                    # Test files
    ├── auth/
    │   ├── login.spec.ts
    │   └── logout.spec.ts
    └── checkout/
        ├── add-to-cart.spec.ts
        └── payment.spec.ts
```

---

## Arrange-Act-Assert

```typescript
test('[TC-001] User can update profile', async ({ page, profilePage }) => {
  // Arrange
  await profilePage.goto();
  const newName = 'Jane Doe';

  // Act
  await profilePage.updateName(newName);
  await profilePage.save();

  // Assert
  await expect(profilePage.nameDisplay).toHaveText(newName);
});
```

Add comments only when sections aren't obvious. Don't over-comment.

---

## Grouping with `describe`

Group related tests; use sparingly.

```typescript
test.describe('Login', () => {
  test('[TC-001] valid credentials redirect', async ({ page }) => { /* */ });
  test('[TC-002] invalid credentials show error', async ({ page }) => { /* */ });
  test('[TC-003] empty fields show validation', async ({ page }) => { /* */ });
});
```

**Tip:** Use fixtures over `beforeEach` when possible. `describe` is for organization, not setup.

---

## `test.step()` for Readable Traces

Break complex tests into named steps. Steps appear in the trace viewer and HTML report.

```typescript
test('[TC-010] Complete checkout flow', async ({ page, cartPage, checkoutPage }) => {
  await test.step('Add items to cart', async () => {
    await cartPage.addItem('Widget');
    await cartPage.addItem('Gadget');
  });

  await test.step('Apply discount code', async () => {
    await cartPage.applyCode('SAVE10');
    await expect(cartPage.discount).toHaveText('-$5.00');
  });

  await test.step('Complete payment', async () => {
    await checkoutPage.proceedToCheckout();
    await checkoutPage.fillPayment(testCard);
    await checkoutPage.submit();
  });

  await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
});
```

---

## Test Modifiers

| Modifier | Use case |
|----------|----------|
| `test.skip()` | Won't run, but tracked |
| `test.fixme()` | Known broken; will fail until fixed |
| `test.fail()` | Test currently fails (asserts as expected) |
| `test.only()` | Dev-only; CI fails if `forbidOnly: true` |
| `test.slow()` | Triple the timeout |

```typescript
test.fixme('[TC-099] Pagination breaks at page 3', async ({ page }) => {
  // Will mark as expected-fail until fixed
});

test.skip(({ browserName }) => browserName === 'webkit', 'WebKit issue');
```

---

## Parallel vs Serial

### Default: tests in a file run **sequentially** (workers parallelize files).

### Force parallel within a file
```typescript
test.describe.configure({ mode: 'parallel' });

test('a', async ({ page }) => { /* */ });
test('b', async ({ page }) => { /* */ });  // runs in parallel with 'a'
```

### Force serial (e.g., shared mutable state)
```typescript
test.describe.configure({ mode: 'serial' });
```

**Rule:** Prefer isolated tests + parallel mode. Serial is a last resort.

---

## `testInfo` API

Every test fixture and hook has access to `testInfo`, Playwright's per-test metadata.

```typescript
test('uses testInfo', async ({ page }, testInfo) => {
  // Worker identity (for unique data)
  console.log(testInfo.parallelIndex);
  console.log(testInfo.workerIndex);

  // Auto-cleaned output directory
  const tmpFile = path.join(testInfo.project.outputDir, 'data.json');

  // Attach files to the report
  await testInfo.attach('api-response', {
    body: JSON.stringify(data),
    contentType: 'application/json',
  });
  await testInfo.attach('screenshot', {
    path: 'screenshot.png',
    contentType: 'image/png',
  });

  // Add metadata (shows in report)
  testInfo.annotations.push({
    type: 'jira',
    description: 'AUTH-123',
  });

  // Custom retry/timeout adjustments
  testInfo.setTimeout(60_000);
});
```

Use `testInfo.project.outputDir` for ephemeral files, Playwright auto-cleans it before each run.

---

## Tagging & Filtering

```bash
# Run only smoke tests
npx playwright test --grep @smoke

# Skip slow tests
npx playwright test --grep-invert @slow

# Run by file glob
npx playwright test tests/specs/auth/
```

---

## Anti-Patterns

```typescript
// ❌ BAD: Tests depend on each other
test('1. login', ...);
test('2. add item (assumes login)', ...);

// ✅ GOOD: Each test sets up its own state via fixtures
test('add item', async ({ loggedInPage }) => { /* */ });
```

```typescript
// ❌ BAD: Vague names
test('test 1', ...);
test('it works', ...);

// ✅ GOOD: Descriptive
test('[TC-001] User can add item to empty cart @P1 @smoke', ...);
```

```typescript
// ❌ BAD: Multiple unrelated assertions
test('dashboard', async ({ page }) => {
  await expect(profile).toBeVisible();
  await expect(orders).toBeVisible();
  await expect(notifications).toBeVisible();  // Three concerns in one test
});

// ✅ GOOD: One concern, or use soft assertions
test('dashboard renders all sections', async ({ page }) => {
  await expect.soft(profile).toBeVisible();
  await expect.soft(orders).toBeVisible();
  await expect.soft(notifications).toBeVisible();
});
```
