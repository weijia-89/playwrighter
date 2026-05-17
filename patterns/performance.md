# Performance Testing

**Sources**: [playwright-lighthouse](https://www.npmjs.com/package/playwright-lighthouse), [Web Vitals](https://web.dev/vitals/), [Unlighthouse + Playwright](https://unlighthouse.dev/learn-lighthouse/playwright)

Two complementary approaches:
1. **Lighthouse audits**, full perf/a11y/SEO scoring per page (slow, comprehensive)
2. **Performance metrics**, real-time Web Vitals during tests (fast, focused)

---

## Lighthouse Audits

```bash
npm i -D playwright-lighthouse lighthouse
```

### Setup
Lighthouse needs Chrome's DevTools port. Launch Chromium with `--remote-debugging-port`:

```typescript
// playwright.config.ts (perf project only)
projects: [
  {
    name: 'perf',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: {
        args: ['--remote-debugging-port=9222'],
      },
    },
  },
],
```

### Audit a page
```typescript
import { test } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test('homepage Lighthouse @perf', async ({ page }) => {
  await page.goto('/');

  await playAudit({
    page,
    port: 9222,
    thresholds: {
      performance: 80,
      accessibility: 95,
      'best-practices': 90,
      seo: 90,
    },
    reports: {
      formats: { html: true, json: true },
      directory: 'lighthouse-reports',
    },
  });
});
```

The test fails if any score drops below threshold.

---

## Web Vitals (Real-Time)

For per-test perf without full Lighthouse overhead:

```typescript
test('LCP under 2.5s', async ({ page }) => {
  await page.goto('/');

  const lcp = await page.evaluate(() => new Promise<number>((resolve) => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      resolve(lastEntry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  }));

  expect(lcp).toBeLessThan(2500);
});
```

### Core Web Vitals snapshot
```typescript
const vitals = await page.evaluate(() => new Promise<{
  LCP: number; CLS: number; INP: number;
}>((resolve) => {
  const result = { LCP: 0, CLS: 0, INP: 0 };

  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    result.LCP = entries[entries.length - 1].startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  new PerformanceObserver((list) => {
    let cls = 0;
    list.getEntries().forEach((entry: any) => {
      if (!entry.hadRecentInput) cls += entry.value;
    });
    result.CLS = cls;
  }).observe({ type: 'layout-shift', buffered: true });

  setTimeout(() => resolve(result), 3000);
}));

expect(vitals.LCP).toBeLessThan(2500);
expect(vitals.CLS).toBeLessThan(0.1);
```

### Plug-and-play library
```bash
npm i -D playwright-performance-metrics
```

Auto-collects standard metrics into a fixture.

---

## Network Performance

### Slow network simulation
```typescript
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 200,            // ms
  downloadThroughput: 750_000 / 8,  // ~750kbps (Slow 3G)
  uploadThroughput: 250_000 / 8,
});
```

### Track network bytes
```typescript
let totalBytes = 0;
page.on('response', async (response) => {
  const headers = await response.allHeaders();
  totalBytes += parseInt(headers['content-length'] || '0', 10);
});

await page.goto('/');
expect(totalBytes).toBeLessThan(2_000_000);  // 2 MB budget
```

---

## CPU Throttling

```typescript
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });  // 4x slowdown
```

Useful for testing perceived performance on lower-end devices.

---

## Memory Leaks (Heap Snapshots)

```typescript
test('no memory leak after navigation cycle', async ({ page }) => {
  await page.goto('/');
  const cdp = await page.context().newCDPSession(page);

  // Baseline
  await cdp.send('HeapProfiler.collectGarbage');
  const before: any = await cdp.send('Runtime.getHeapUsage');

  // Stress
  for (let i = 0; i < 50; i++) {
    await page.goto('/heavy-page');
    await page.goto('/');
  }

  // Compare
  await cdp.send('HeapProfiler.collectGarbage');
  const after: any = await cdp.send('Runtime.getHeapUsage');

  const growth = after.usedSize - before.usedSize;
  expect(growth).toBeLessThan(10_000_000);  // 10 MB tolerance
});
```

---

## CI Setup

Run perf tests separately from functional:

```typescript
// playwright.config.ts
projects: [
  { name: 'chromium', use: devices['Desktop Chrome'] },
  {
    name: 'perf',
    testMatch: /.*\.perf\.spec\.ts$/,
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: { args: ['--remote-debugging-port=9222'] },
    },
  },
],
```

CI:
```bash
# Fast: functional only on PR
npx playwright test --project=chromium

# Slow: perf nightly
npx playwright test --project=perf
```

---

## Trends Over Time

For perf trends, push results to a database:

```typescript
test.afterEach(async ({}, testInfo) => {
  if (testInfo.tags.includes('@perf')) {
    await fetch('https://your-metrics-db/perf', {
      method: 'POST',
      body: JSON.stringify({
        test: testInfo.title,
        commit: process.env.GITHUB_SHA,
        metrics: testInfo.attachments,
      }),
    });
  }
});
```

Tools like Currents, Datadog, or Grafana visualize trends.

---

## Best Practices

1. **Lighthouse for big-picture**, slow, comprehensive, runs nightly
2. **Web Vitals for per-test**, fast, surfaces regressions immediately
3. **Tag perf tests**, `@perf`, run separately from PR gate
4. **Set budgets**, `LCP < 2.5s`, `CLS < 0.1`, `INP < 200ms`
5. **Throttle network/CPU**, test on simulated slow devices
6. **Track trends**, single-run measurements are noisy
7. **Stable env**, perf is OS/hardware-sensitive; use Linux CI consistently

---

## Anti-Patterns

```typescript
// ❌ Pass/fail on a single sample
expect(lcp).toBeLessThan(2500);
// Single sample is noisy; consider running 5+ times or comparing to baseline

// ✅ Run multiple times, take median
const samples = [];
for (let i = 0; i < 5; i++) {
  await page.goto('/');
  samples.push(await measureLCP(page));
}
const median = samples.sort()[Math.floor(samples.length / 2)];
expect(median).toBeLessThan(2500);
```

```yaml
# ❌ Perf on macOS CI
runs-on: macos-latest
# 10x more expensive AND less reproducible

# ✅ Linux for perf
runs-on: ubuntu-22.04
```

```typescript
// ❌ Lighthouse on every PR
test('homepage @perf', ...);
// Slow, blocks merges

// ✅ Tag and run nightly
test('homepage @perf @nightly', ...);
```

---

## Resources

- https://www.npmjs.com/package/playwright-lighthouse
- https://web.dev/vitals/
- https://unlighthouse.dev/learn-lighthouse/playwright
- https://github.com/Valiantsin2021/playwright-performance-metrics
