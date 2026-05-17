# Assertion Patterns

**Source**: [Playwright Test Assertions Docs](https://playwright.dev/docs/test-assertions)

---

## Core Principle

**Always use specific assertions. NEVER use `.toBeTruthy()` or generic checks.**

---

## Visibility Assertions

```typescript
// ✅ GOOD: Check element visibility
await expect(page.getByText('Success')).toBeVisible();
await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

// ✅ GOOD: Check element is hidden
await expect(page.getByText('Loading...')).toBeHidden();
await expect(page.getByText('Error')).not.toBeVisible();
```

---

## Text Assertions

```typescript
// ✅ GOOD: Exact text match
await expect(page.getByRole('heading')).toHaveText('Welcome');

// ✅ GOOD: Partial text match
await expect(page.getByRole('heading')).toContainText('Welcome');

// ✅ GOOD: Regex match for dynamic content
await expect(page.getByTestId('user-count')).toHaveText(/\d+ users online/);
```

---

## Value Assertions (Form Inputs)

```typescript
// ✅ GOOD: Check input values
await expect(page.getByLabel('Email')).toHaveValue('user@example.com');
await expect(page.getByLabel('Age')).toHaveValue('25');

// ✅ GOOD: Check checkbox/radio state
await expect(page.getByLabel('Remember me')).toBeChecked();
await expect(page.getByLabel('Remember me')).not.toBeChecked();
```

---

## URL Assertions

```typescript
// ✅ GOOD: Check URL after navigation
await expect(page).toHaveURL('https://app.example.com/dashboard');
await expect(page).toHaveURL(/.*dashboard/);  // Regex match

// ✅ GOOD: Check URL contains parameter
await expect(page).toHaveURL(/.*\?tab=settings/);
```

---

## State Assertions

```typescript
// ✅ GOOD: Check element state
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('textbox')).toBeEditable();
```

---

## Attribute Assertions

```typescript
// ✅ GOOD: Check element attributes
await expect(page.getByRole('link')).toHaveAttribute('href', '/dashboard');
await expect(page.getByRole('button')).toHaveAttribute('disabled');
await expect(page.getByRole('button')).not.toHaveAttribute('disabled');
```

---

## Count Assertions

```typescript
// ✅ GOOD: Check element count
await expect(page.getByRole('listitem')).toHaveCount(5);
await expect(page.getByRole('article')).toHaveCount(10);
```

---

## Soft Assertions (Multiple Checks)

```typescript
// ✅ GOOD: Use soft assertions for multiple checks
test('Dashboard displays all user info', async ({ page }) => {
  // All assertions are checked even if one fails
  await expect.soft(page.getByText('John Doe')).toBeVisible();
  await expect.soft(page.getByText('john@example.com')).toBeVisible();
  await expect.soft(page.getByText('Premium Member')).toBeVisible();
  await expect.soft(page.getByText('Joined: 2024')).toBeVisible();
});
```

---

## Anti-Patterns

```typescript
// ❌ BAD: Generic checks (false positive risk)
expect(await page.locator('button').count()).toBeTruthy();  // NO!
expect(await page.textContent('h1')).toBeTruthy();  // NO!

// ✅ GOOD: Specific assertions
await expect(page.getByRole('button')).toHaveCount(3);
await expect(page.getByRole('heading')).toHaveText('Welcome');
```

```typescript
// ❌ BAD: No assertion after action
await page.getByRole('button', { name: 'Submit' }).click();
// Test passes even if nothing happened!

// ✅ GOOD: Always assert expected result
await page.getByRole('button', { name: 'Submit' }).click();
await expect(page.getByText('Success')).toBeVisible();
```

---

## Poll a Value: `expect.poll()`

Polls a function until its return value matches an assertion. Different from `toPass()`, that retries a block; `poll()` watches a single value over time.

```typescript
// ✅ Poll until API returns the expected status
await expect.poll(async () => {
  const response = await page.request.get('/api/order/123');
  return response.status();
}, {
  intervals: [500, 1_000, 2_000, 5_000],
  timeout: 30_000,
}).toBe(200);

// ✅ Poll a UI count
await expect.poll(
  () => page.getByRole('listitem').count(),
  { timeout: 10_000 }
).toBeGreaterThan(5);
```

Use `poll` for: API status checks, async backend updates, count-based waits.

---

## Retry a Block: `expect.toPass()`

For probing flows that need multiple coordinated checks, wrap them in `expect.toPass()`. Playwright retries the entire block until it passes or times out.

```typescript
// ✅ Retry a multi-step verification
await expect(async () => {
  const response = await page.request.get('/api/order/123');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.status).toBe('shipped');
}).toPass({ timeout: 10_000, intervals: [500, 1000, 2000] });
```

Use cases:
- Polling an API for state change
- Eventual consistency checks
- Multi-condition UI states

**Don't use** for simple element waits, `await expect(locator).toBeVisible()` is sufficient.

---

## Web-First vs Manual Assertions

**Web-first assertions auto-retry until timeout.** Always use them.

```typescript
// ✅ Web-first (auto-retries)
await expect(page.getByText('welcome')).toBeVisible();

// ❌ Manual (no retry, captures one moment in time)
expect(await page.getByText('welcome').isVisible()).toBe(true);
```

The manual form is the #1 cause of flaky tests. Even if the element appears 100ms later, `isVisible()` returned `false` and the test fails.

---

## One Concern Per Test

The "one assertion per test" rule is oversimplified. The real rule:

**One logical concern per test. Multiple assertions verifying that concern are fine.**

```typescript
// ✅ GOOD: One concern (login flow), multiple verifications
test('[TC-001] Login redirects and shows welcome', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('pass123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByText('Welcome')).toBeVisible();
  await expect(page.getByTestId('user-menu')).toBeVisible();
});
```

**Use `expect.soft()`** for non-blocking related checks (see Soft Assertions section above).

**Split tests** when concerns are unrelated (e.g., login redirect vs. welcome banner content vs. menu rendering).

---

## Summary

- Use `.toBeVisible()` not `.toBeTruthy()`
- Use web-first `await expect(x)...` not `expect(await x.isVisible())`
- Use `.toHaveText()` not string comparison
- Assert after every important action
- One concern per test; multiple assertions OK if they verify that concern
- Use `expect.soft()` for related non-blocking checks
- Make failures debuggable with specific matchers
