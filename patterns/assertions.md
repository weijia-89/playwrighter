# Assertion Patterns

**Source**: QualityForge, Mailchimp, MC QA Tools  
**Confidence**: 98%

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

## One Assertion Per Test (Guideline)

```typescript
// ✅ GOOD: Test one logical thing
test('[TC-001] Login redirects to dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('pass123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Single logical assertion (redirect happened)
  await expect(page).toHaveURL(/.*dashboard/);
});

test('[TC-002] Dashboard shows welcome message', async ({ page }) => {
  // Separate test for different concern
  await expect(page.getByText('Welcome back')).toBeVisible();
});
```

---

## Summary

- Use `.toBeVisible()` not `.toBeTruthy()`
- Use `.toHaveText()` not string comparison
- Assert after every important action
- One logical assertion per test (soft assertions are OK for related checks)
- Make failures debuggable with specific matchers
