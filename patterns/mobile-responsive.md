# Mobile & Responsive Testing

**Source**: [Playwright Emulation Docs](https://playwright.dev/docs/emulation)

Playwright runs desktop browsers but **emulates mobile devices** via viewport, touch, user agent, and other knobs. Real device testing still matters for final QA, but emulation catches 80%+ of issues.

---

## Devices Registry

```typescript
import { devices } from '@playwright/test';

// Use a preset device
projects: [
  { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
  { name: 'tablet', use: { ...devices['iPad Pro'] } },
]
```

The preset includes viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, and the right browser engine (WebKit for iOS, Chromium for Android).

List available devices: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptors.json

---

## Custom Viewport

```typescript
// Per-project
{ name: 'small', use: { viewport: { width: 320, height: 568 } } }

// Per-test
test.use({ viewport: { width: 375, height: 667 } });
test('iPhone SE size', async ({ page }) => { /* */ });

// Mid-test resize
await page.setViewportSize({ width: 1280, height: 720 });
```

---

## Mobile Emulation Knobs

```typescript
{
  ...devices['iPhone 15'],
  // Override or extend the preset
  geolocation: { latitude: 37.7749, longitude: -122.4194 },
  permissions: ['geolocation', 'notifications'],
  locale: 'en-US',
  timezoneId: 'America/Los_Angeles',
  colorScheme: 'dark',
}
```

---

## Geolocation

```typescript
// Per-test
test.use({
  geolocation: { latitude: 37.7749, longitude: -122.4194 },
  permissions: ['geolocation'],
});

test('finds nearby coffee', async ({ page }) => {
  await page.goto('/find-coffee');
  await expect(page.getByText('Coffee in San Francisco')).toBeVisible();
});

// Mid-test change
await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
```

---

## Locale & Timezone

```typescript
test.use({
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
});

test('shows French currency', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText('29,99 €')).toBeVisible();
});
```

---

## Color Scheme & Reduced Motion

```typescript
test.use({ colorScheme: 'dark' });

test('dark mode renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
});

// Reduced motion
test('animations disabled when prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero')).not.toHaveClass(/animate/);
});
```

### Print preview
```typescript
await page.emulateMedia({ media: 'print' });
await expect(page).toHaveScreenshot('invoice-print.png');
```

---

## Permissions

```typescript
test.use({ permissions: ['notifications', 'clipboard-read', 'clipboard-write'] });

test('copies link to clipboard', async ({ page }) => {
  await page.goto('/share');
  await page.getByRole('button', { name: 'Copy link' }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe('https://example.com/abc');
});
```

---

## Offline Mode

```typescript
test('offline banner appears', async ({ page, context }) => {
  await page.goto('/');
  await context.setOffline(true);
  await expect(page.getByText("You're offline")).toBeVisible();
  await context.setOffline(false);
});
```

---

## Multi-Project Pattern (Recommended)

Test the same suite across breakpoints:

```typescript
// playwright.config.ts
projects: [
  { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
],
```

Run all:
```bash
npx playwright test                  # all projects
npx playwright test --project=mobile-chrome
```

---

## Responsive-Specific Tests

For responsive-only checks, **split into separate tests** rather than branching with `isMobile` (the linter `playwright/no-conditional-in-test` flags branching).

```typescript
// ✅ Mobile-only test
test('[TC-101] hamburger menu visible @mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
});

// ✅ Desktop-only test
test('[TC-102] full nav visible @desktop', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toBeVisible();
});
```

Then run by project + tag:
```bash
npx playwright test --grep @mobile --project=mobile-chrome
npx playwright test --grep @desktop --project=chromium
```

To enforce per-project tag filtering, set `grep` per project in config:
```typescript
projects: [
  { name: 'chromium', grep: /@desktop|@critical/, use: { ... } },
  { name: 'mobile-chrome', grep: /@mobile|@critical/, use: { ...devices['Pixel 7'] } },
],
```

---

## Visual Regression Across Viewports

Each project's snapshots are stored separately:
```
home.spec.ts-snapshots/
├── homepage-1-desktop-chrome-darwin.png
├── homepage-1-mobile-chrome-darwin.png
└── homepage-1-mobile-safari-darwin.png
```

---

## Real Device Cloud (Optional)

Emulation isn't 100%. For final QA, use:
- BrowserStack: `playwright.connect()` to their grid
- Sauce Labs: similar
- Appetize: virtual mobile devices
- LambdaTest

These all integrate with Playwright via `chromium.connect()` to a remote endpoint.

---

## Best Practices

1. **Use the `devices` registry**, calibrated presets, not hand-rolled viewports
2. **Test at standard breakpoints**, 375 (mobile), 768 (tablet), 1280 (desktop)
3. **Don't over-test**, pick critical paths per breakpoint, not full suite × breakpoints
4. **Tag responsive tests**, `@mobile`, `@tablet` for selective runs
5. **Visual diff per breakpoint**, auto-generated separate baselines
6. **Don't hand-set every option**, preset device has it right
7. **Reserve real devices for final QA**, emulation catches 80%+, real devices catch the rest

---

## Anti-Patterns

```typescript
// ❌ Hardcoded viewport without context
await page.setViewportSize({ width: 375, height: 667 });
// What device is this? iPhone? What year?

// ✅ Use device preset
test.use(devices['iPhone 15']);
```

```typescript
// ❌ Same test runs across all projects (wasteful)
test('login works', async ({ page }) => { /* */ });

// ✅ Tag and filter
test('login works @critical', async ({ page }) => { /* */ });
test('hamburger menu @mobile', async ({ page }) => { /* */ });
```

---

## Resources

- https://playwright.dev/docs/emulation
- Device list: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptors.json
