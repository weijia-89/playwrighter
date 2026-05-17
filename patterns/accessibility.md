# Accessibility Testing

**Source**: [Playwright Accessibility Docs](https://playwright.dev/docs/accessibility-testing), [@axe-core/playwright](https://www.npmjs.com/package/@axe-core/playwright)

---

## Install

```bash
npm install -D @axe-core/playwright
```

---

## Basic Scan

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no a11y violations @a11y', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Recommended: Shared Fixture

Centralize axe configuration to avoid drift across tests.

```typescript
// tests/fixtures.ts
import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    const builder = () => new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
    await use(builder);
  },
});

export { expect } from '@playwright/test';
```

Use:
```typescript
test('checkout a11y', async ({ page, makeAxeBuilder }) => {
  await page.goto('/checkout');
  const results = await makeAxeBuilder().analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Scoping Scans

### Specific region
```typescript
const results = await new AxeBuilder({ page })
  .include('main')        // CSS selector
  .exclude('.ad-banner')  // skip third-party
  .analyze();
```

### By WCAG level
```typescript
new AxeBuilder({ page })
  .withTags(['wcag2aa']);  // strictest you target
```

### Specific rules
```typescript
new AxeBuilder({ page })
  .disableRules(['color-contrast']);  // known issue, tracked separately
```

---

## Filter by Severity

axe-core tags each violation with `impact`: `minor`, `moderate`, `serious`, `critical`. Common policy: only block on `serious` or `critical` until backlog is cleared.

```typescript
test('serious+ a11y issues only', async ({ page, makeAxeBuilder }) => {
  await page.goto('/');
  const results = await makeAxeBuilder().analyze();

  const blocking = results.violations.filter(
    v => v.impact === 'serious' || v.impact === 'critical'
  );

  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});
```

Track minor/moderate separately (snapshot or attachment) so they don't get lost.

---

## Handling Known Violations

### Track via attachment + snapshot

```typescript
test('a11y with known issues snapshot', async ({ page }, testInfo) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();

  // Attach full report to test result
  await testInfo.attach('a11y-scan', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });

  // Compare violations to baseline (catches regressions but allows known issues)
  expect(results.violations).toMatchSnapshot('homepage-violations.json');
});
```

### Exclude specific elements
```typescript
.exclude('#legacy-widget')  // until refactored
```

---

## Per-Page Coverage Strategy

Add `@a11y` tagged tests per critical page:

```typescript
test.describe('A11y - Critical pages @a11y', () => {
  for (const url of ['/', '/products', '/cart', '/checkout', '/account']) {
    test(`${url}`, async ({ page, makeAxeBuilder }) => {
      await page.goto(url);
      const results = await makeAxeBuilder().analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
```

Run separately:
```bash
npx playwright test --grep @a11y
```

---

## Limitations

axe-core catches ~30-40% of accessibility issues. It does NOT catch:
- Keyboard navigation flow (test manually + with `page.keyboard.press('Tab')`)
- Screen reader announcements (use `@guidepup/Playwright`, see below)
- Logical reading order
- Meaningful alt text (just checks presence)
- Cognitive load issues

**Pair automated scans with manual audits + keyboard testing.**

---

## Screen Reader Testing with Guidepup

For programmatic screen reader testing, the only automated way to verify VoiceOver/NVDA announcements:

```bash
npm i -D @guidepup/playwright @guidepup/guidepup
```

```typescript
import { voiceOverTest as test, expect } from '@guidepup/playwright';

test.describe('macOS VoiceOver', () => {
  test('button announces correctly', async ({ page, voiceOver }) => {
    await page.goto('/');
    await voiceOver.interact();
    await voiceOver.next();
    const phrase = await voiceOver.lastSpokenPhrase();
    expect(phrase).toContain('Submit, button');
  });
});
```

**Caveats:**
- macOS only for VoiceOver tests; Windows for NVDA tests
- Requires VoiceOver/NVDA enabled at OS level
- Run on dedicated CI runners (not parallel with other tests)
- Not for every test, pick critical accessible flows

Source: https://github.com/guidepup/guidepup-playwright

---

## Keyboard Navigation Tests

```typescript
test('can tab through form @a11y', async ({ page }) => {
  await page.goto('/contact');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Name')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();
});
```

---

## Best Practices

1. **Centralize axe config in a fixture**, consistent across tests
2. **Tag a11y tests**, `@a11y` for selective runs
3. **Cover critical pages**, login, checkout, key flows
4. **Don't ignore violations silently**, track or fix
5. **Pair with keyboard tests**, automation can't replace manual audits
6. **Run on CI**, every PR
