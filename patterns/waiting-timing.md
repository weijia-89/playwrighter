# Waiting & Timing Patterns

**Source**: [Playwright Auto-waiting Docs](https://playwright.dev/docs/actionability), [Best Practices](https://playwright.dev/docs/best-practices)

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

**Prefer web-first assertions over `waitFor()`**, better error messages, auto-retry built in.

```typescript
// ✅ BEST: Web-first assertion (recommended)
await expect(page.getByText('Success')).toBeVisible();
await expect(page.getByText('Loading...')).toBeHidden();

// ✅ Acceptable: Explicit waitFor when you don't want an assertion
await page.getByRole('button').waitFor({ state: 'attached' });
```

**Why prefer `expect().toBeVisible()`:**
- Auto-retries until timeout (same as `waitFor`)
- Better failure messages in trace + report
- Reads as both wait + verification

### Wait for Page Load (SPA Pattern)

```typescript
// ✅ GOOD: SPA navigation pattern
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
// ❌ BAD: many SPAs have continuous analytics/WebSocket traffic
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

## Why `networkidle` Fails for SPAs

`waitForLoadState('networkidle')` resolves when no network activity for 500ms. But modern SPAs constantly emit:
- Analytics beacons (Segment, Heap, GA)
- WebSocket heartbeats
- Polling requests
- Service worker syncs
- Lazy-loaded chunks

The page is fully usable, but `networkidle` waits forever (then times out).

**Solution:** wait for what you actually care about, a specific element being visible.

```typescript
// ❌ Hangs on SPAs
await page.waitForLoadState('networkidle');

// ✅ Specific signal
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
```

This is reinforced by Playwright's official docs: "Avoid relying on network idle for SPAs."

---

## Summary Checklist

- [ ] No `waitForTimeout()` in tests
- [ ] No `networkidle` for SPAs
- [ ] Use `domcontentloaded` + element wait for page loads
- [ ] Assert visibility/state instead of arbitrary waits
- [ ] Increase timeouts only for genuinely slow operations
- [ ] Trust Playwright's auto-waiting for actions (click, fill, etc.)
