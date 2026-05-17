# Visual Regression Testing

**Source**: [Playwright Visual Comparisons Docs](https://playwright.dev/docs/test-snapshots)

---

## Basic Pattern

```typescript
test('homepage visual', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot();
});
```

**First run**, generates baseline at `tests/specs/home.spec.ts-snapshots/homepage-1-chromium-darwin.png`.
**Subsequent runs**, pixel-by-pixel comparison.

---

## Update Baselines

```bash
# Update all
npx playwright test --update-snapshots

# Update specific
npx playwright test home.spec.ts --update-snapshots
```

Commit baselines to source control. They are part of your test suite.

---

## Stability Configuration

### Per-test
```typescript
await expect(page).toHaveScreenshot({
  maxDiffPixels: 100,
  animations: 'disabled',
  mask: [page.getByTestId('timestamp')], // hide volatile regions
  clip: { x: 0, y: 0, width: 1280, height: 720 }, // partial screenshot
});
```

### Global (in playwright.config.ts)
```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,
    animations: 'disabled',
  },
},
```

---

## Volatile Element Strategies

### Mask dynamic regions
```typescript
await expect(page).toHaveScreenshot({
  mask: [
    page.getByTestId('current-time'),
    page.getByText(/\d+ users online/),
  ],
});
```

### Inject CSS via stylePath
```css
/* tests/screenshot.css */
iframe { visibility: hidden !important; }
.advertisement { display: none !important; }
.animation { animation: none !important; }
```

```typescript
await expect(page).toHaveScreenshot({
  stylePath: path.join(__dirname, 'screenshot.css'),
});
```

---

## CI Considerations

### Per-platform baselines
Playwright auto-suffixes with browser + OS:
```
homepage-1-chromium-darwin.png   # Mac
homepage-1-chromium-linux.png    # Linux CI
homepage-1-firefox-win32.png     # Windows
```

### Generate on Linux for CI consistency
Run `--update-snapshots` on the same OS that CI uses (or in a Docker container).

```bash
# Generate baselines in Docker matching CI
docker run -v $(pwd):/work mcr.microsoft.com/playwright:latest \
  npx playwright test --update-snapshots
```

---

## Component-Level Screenshots

```typescript
const navBar = page.getByRole('navigation');
await expect(navBar).toHaveScreenshot('nav-bar.png');
```

Smaller scope = more stable + faster + clearer failures.

---

## Tolerance Tuning

| Threshold | Use |
|-----------|-----|
| `maxDiffPixels: 0` | Exact match (rarely practical) |
| `maxDiffPixels: 100` | Default for noise tolerance |
| `maxDiffPixelRatio: 0.01` | 1% of pixels can differ |
| `threshold: 0.2` | Per-pixel color tolerance (0–1) |

Start strict; relax only as needed with reasons.

---

## Best Practices

1. **Disable animations**, `animations: 'disabled'` always
2. **Mask volatile content**, timestamps, user counts, ads
3. **Generate on CI's OS**, Mac vs Linux render differently
4. **One baseline per breakpoint**, desktop + mobile if you support both
5. **Component-scope when possible**, easier to debug failures
6. **Review diffs in HTML report**, Playwright shows actual/expected/diff

---

## Anti-Patterns

```typescript
// ❌ BAD: No animation handling
await expect(page).toHaveScreenshot();  // flake city

// ✅ GOOD
await expect(page).toHaveScreenshot({ animations: 'disabled' });
```

```typescript
// ❌ BAD: Pixel-exact on dynamic content
await expect(page.getByText(/Last login: .+/)).toHaveScreenshot();

// ✅ GOOD: Mask the dynamic part
await expect(page).toHaveScreenshot({
  mask: [page.getByText(/Last login/)],
});
```
