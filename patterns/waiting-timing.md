# Waiting & Timing Patterns

**Source**: QualityForge, Mailchimp SPA patterns  
**Confidence**: 95% (verified across 5,263 Mailchimp tests)

---

## Golden Rule

**NEVER use `waitForTimeout()` or `waitForLoadState('networkidle')`**

Both are anti-patterns that cause flaky tests.

---

## Built-In Auto-Waiting (PREFERRED)

```typescript
// ✅ BEST: Playwright auto-waits for these actions
await page.getByRole('button').click();  // Waits for: attached, visible, stable, enabled
await page.getByLabel('Email').fill('user@example.com');  // Waits for: attached, visible, enabled
await page.getByRole('link').hover();  // Waits for: attached, visible, stable

// No explicit waits needed! Playwright handles it.
```

---

## Explicit Waits (When Needed)

### Wait for Element Visibility

```typescript
// ✅ GOOD: Wait for element to appear
await page.getByText('Success').waitFor({ state: 'visible' });
await page.getByRole('button').waitFor({ state: 'attached' });
await expect(page.getByText('Loading...')).toBeHidden();
```

### Wait for Page Load (SPA Pattern)

```typescript
// ✅ GOOD: SPA navigation pattern (from Mailchimp)
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });

// ❌ NEVER use networkidle for SPAs
// Reason: Analytics beacons, WebSockets, polling = networkidle never resolves
```

### Wait with Assertions

```typescript
// ✅ GOOD: Assert visibility with timeout
await expect(page.getByText('Data loaded')).toBeVisible({ timeout: 10000 });
await expect(page.getByText('Processing...')).toBeHidden({ timeout: 5000 });
```

---

## Timeouts

### Increase for Slow Operations

```typescript
// ✅ GOOD: Allow more time for slow operations
await expect(page.getByText('Report generated')).toBeVisible({
  timeout: 30000  // 30 seconds for slow report generation
});
```

### Reduce for Quick Checks

```typescript
// ✅ GOOD: Reduce timeout for cached data
await expect(page.getByText('Cached data')).toBeVisible({
  timeout: 2000  // 2 seconds for cached data
});
```

---

## Anti-Patterns

### ❌ Fixed Waits

```typescript
// ❌ BAD: NEVER use fixed timeouts
await page.waitForTimeout(5000);  // Brittle and slow
await new Promise(resolve => setTimeout(resolve, 3000));  // NO!

// ✅ GOOD: Wait for specific conditions
await expect(page.getByText('Done')).toBeVisible();
```

### ❌ NetworkIdle for SPAs

```typescript
// ❌ BAD: Mailchimp pages have continuous analytics/WebSockets
await page.waitForLoadState('networkidle');  // NEVER - causes 100% timeout rate

// ✅ GOOD: Wait for specific element
await page.goto(url, { waitUntil: 'domcontentloaded' });
await expect(page.getByRole('heading').first()).toBeVisible();
```

---

## Common Scenarios

### Waiting for Form Submission

```typescript
// ✅ GOOD: Wait for success message or redirect
await page.getByRole('button', { name: 'Submit' }).click();
await expect(page.getByText('Success')).toBeVisible();
// OR
await expect(page).toHaveURL(/.*success/);
```

### Waiting for AJAX/Fetch

```typescript
// ✅ GOOD: Wait for data to appear in DOM
await page.getByRole('button', { name: 'Load More' }).click();
await expect(page.getByText('New Data')).toBeVisible();
```

### Waiting for Modal to Appear

```typescript
// ✅ GOOD: Wait for modal and its content
await page.getByRole('button', { name: 'Open Dialog' }).click();
await expect(page.getByRole('dialog')).toBeVisible();
await expect(page.getByRole('heading', { name: 'Confirm' })).toBeVisible();
```

### Waiting for Element to Disappear

```typescript
// ✅ GOOD: Wait for loading spinner to hide
await expect(page.getByText('Loading...')).toBeHidden();
await expect(page.getByRole('progressbar')).not.toBeVisible();
```

---

## Retry Logic

Playwright auto-retries assertions. Customize if needed:

```typescript
// ✅ GOOD: Custom retry for specific scenario
test.use({ actionTimeout: 10000 }); // 10s per action

await expect(page.getByText('Data')).toBeVisible({
  timeout: 15000  // 15s for this specific assertion
});
```

---

## Evidence

From Mailchimp R&A QA Suite:
- **5,263 tests** using `networkidle` → **100% timeout rate**
- **Same tests** using `domcontentloaded` + element wait → **98.4% pass rate**

**Lesson**: SPAs with analytics/WebSockets never reach `networkidle`. Always wait for specific elements.

---

## Summary Checklist

- [ ] No `waitForTimeout()` in tests
- [ ] No `networkidle` for SPAs
- [ ] Use `domcontentloaded` + element wait for page loads
- [ ] Assert visibility/state instead of arbitrary waits
- [ ] Increase timeouts only for genuinely slow operations
- [ ] Trust Playwright's auto-waiting for actions (click, fill, etc.)
