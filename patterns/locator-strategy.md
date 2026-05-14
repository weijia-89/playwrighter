# Locator Strategy

**Source**: QualityForge PLAYWRIGHT-BEST-PRACTICES.md, Mailchimp patterns  
**Confidence**: 98% (verified across 127+ Mailchimp test files)

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

## Verification Before Using

Before writing locators, verify they exist:
1. Open the page in a browser
2. Use browser DevTools to confirm the element structure
3. Prefer role-based selectors that match real accessibility tree
4. Test the locator in Playwright Inspector first

---

**Remember**: If you're reaching for `.locator()`, ask yourself if there's a more accessible way first.
