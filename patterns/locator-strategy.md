# Locator Strategy

**Source**: [Playwright Locators Docs](https://playwright.dev/docs/locators), [Best Practices](https://playwright.dev/docs/best-practices)

---

## Priority Order (ALWAYS FOLLOW)

### 1. Role-based Locators (HIGHEST PRIORITY)

```typescript
// ✅ BEST: Use getByRole for interactive elements
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('link', { name: 'Sign Up' }).click();
await page.getByRole('heading', { name: 'Welcome' });
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

// Common roles:
// - button, link, textbox, checkbox, radio, combobox
// - heading, navigation, main, banner, contentinfo
```

### 2. Label-based Locators (Form Elements)

```typescript
// ✅ GOOD: Use getByLabel for form inputs
await page.getByLabel('Email address').fill('user@example.com');
await page.getByLabel('Password').fill('SecurePass123');
await page.getByLabel('Remember me').check();
```

### 3. Text-based Locators (Visible Text)

```typescript
// ✅ GOOD: Use getByText for elements with visible text
await page.getByText('Welcome back').waitFor();
await page.getByText('Success', { exact: true }).click();

// Partial match (use when exact text is dynamic)
await page.getByText(/Thank you/i).waitFor();
```

### 4. Test ID Locators (When Explicitly Mentioned)

```typescript
// ✅ ACCEPTABLE: Use getByTestId when data-testid is mentioned
await page.getByTestId('submit-button').click();
await page.getByTestId('user-profile-menu').click();

// Note: Only use when test case explicitly mentions data-testid attribute
```

### 5. CSS/XPath (LAST RESORT)

```typescript
// ⚠️ USE SPARINGLY: Only when no better option exists
await page.locator('button.submit-btn').click();

// Add TODO comment explaining why this was necessary
// TODO: Refactor to use accessible locator once data-testid is added
```

---

## Best Practices

### Combine Locators for Specificity

```typescript
// ✅ GOOD: Combine locators to be more specific
await page
  .locator('form')
  .getByRole('button', { name: 'Submit' })
  .click();

await page
  .getByRole('navigation')
  .getByRole('link', { name: 'About' })
  .click();
```

### Use Filter for Multiple Matches

```typescript
// ✅ GOOD: Filter locators when multiple elements match
await page
  .getByRole('listitem')
  .filter({ hasText: 'Active' })
  .first()
  .click();
```

### Avoid Brittle Selectors

```typescript
// ❌ BAD: Too specific, breaks easily
await page.locator('div > div > ul > li:nth-child(3) > a').click();

// ✅ GOOD: Semantic and resilient
await page.getByRole('link', { name: 'Dashboard' }).click();
```

---

## Why This Matters

1. **Accessibility**: Using role/label/text ensures your tests verify accessible markup
2. **Resilience**: Semantic locators survive UI refactors better than CSS classes
3. **Readability**: `getByRole('button', { name: 'Submit' })` is clearer than `.btn-primary.submit`
4. **Maintenance**: When a designer changes CSS classes, role-based tests keep working

---

## Common Patterns

### Buttons
```typescript
await page.getByRole('button', { name: 'Add to Cart' }).click();
await page.getByRole('button', { name: /submit/i }).click(); // case-insensitive
```

### Links
```typescript
await page.getByRole('link', { name: 'Product Details' }).click();
```

### Form Inputs
```typescript
await page.getByLabel('Email').fill('user@example.com');
await page.getByLabel('Password', { exact: true }).fill('pass123');
```

### Checkboxes/Radio
```typescript
await page.getByLabel('I agree to terms').check();
await page.getByRole('radio', { name: 'Express shipping' }).click();
```

### Headings
```typescript
await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();
```

### Navigation
```typescript
const nav = page.getByRole('navigation');
await nav.getByRole('link', { name: 'Products' }).click();
```

---

## Generating Locators (Codegen)

Playwright's official codegen tool picks accessible locators automatically.

```bash
npx playwright codegen https://your-site.com
```

This opens a browser + inspector. Click "Pick locator" and hover over elements, Playwright suggests the most resilient selector (role > text > test-id > CSS).

**Use codegen first**, then refine. Don't hand-write locators from CSS.

### VS Code Extension
Install **Playwright Test for VSCode**. It provides:
- Inline "Pick locator" command
- Run/debug individual tests
- Record new tests
- Show trace inline

---

## Verification

1. **Codegen first**, `npx playwright codegen <url>` for new tests
2. **VS Code extension**, pick locators inline while writing
3. **Test in UI mode**, `npx playwright test --ui` for fast feedback
4. **Confirm in trace**, open trace.zip to see what locator matched

---

**Rule of thumb**: If you reach for `.locator()` with CSS, you're probably doing it wrong. Codegen will almost always offer a better alternative.
