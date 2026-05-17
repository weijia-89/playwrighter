# CI/CD Configuration

**Source**: [Playwright CI Docs](https://playwright.dev/docs/ci), [Sharding Docs](https://playwright.dev/docs/test-sharding)

---

## Core Principles

1. **Run on Linux**, cheaper than Mac/Windows
2. **Install only browsers you test**, saves time + disk
3. **Shard for speed**, parallelism across machines
4. **Blob reporter on CI**, merge into final HTML
5. **Trace on retry**, debug flakes without overhead
6. **Upload artifacts**, traces, reports, screenshots

---

## GitHub Actions: Sharded Setup

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    timeout-minutes: 30
    # Pin OS for reproducibility (avoid `latest` drift)
    runs-on: ubuntu-22.04
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: lts/*
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run tests (shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
        env:
          # Pull credentials from GitHub Actions secrets
          BASE_URL: ${{ secrets.STAGING_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}

      - name: Upload blob report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report
          retention-days: 1

  merge-reports:
    if: ${{ !cancelled() }}
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: lts/*
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Download blob reports
        uses: actions/download-artifact@v5
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge into HTML report
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-html-report
          path: playwright-report
          retention-days: 14
```

---

## Required Config for Sharding

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: process.env.CI ? [['blob'], ['github']] : 'html',
  // blob is required for merge-reports
});
```

---

## Browser Install Optimization

```bash
# Install all (slow, large)
npx playwright install --with-deps

# Install only what you test
npx playwright install chromium --with-deps

# Multiple
npx playwright install chromium firefox --with-deps
```

`--with-deps` adds OS dependencies (recommended in CI).

---

## Caching Browsers

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

---

## Auth State Reuse Across Shards

If your auth setup is expensive, cache the storage state:

```yaml
- name: Cache auth state
  uses: actions/cache@v4
  with:
    path: playwright/.auth
    key: auth-${{ github.run_id }}
```

Or run setup as a separate dependent job and pass the state via artifact.

---

## Failure Artifacts

```yaml
- name: Upload traces on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: traces-${{ matrix.shardIndex }}
    path: test-results/**/trace.zip
    retention-days: 14
```

---

## Local CI Reproduction

```bash
# Match CI environment
CI=1 npx playwright test

# Run a single shard locally
npx playwright test --shard=1/4
```

---

## Other CI Systems

### GitLab CI
```yaml
test:
  image: mcr.microsoft.com/playwright:v1.50.0-jammy
  parallel: 4
  script:
    - npm ci
    - npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

### Docker
```dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npx", "playwright", "test"]
```

---

## Performance Tuning

| Config | Effect |
|--------|--------|
| `workers: 4` | Parallel processes per machine |
| `--shard=1/N` | Spread across N machines |
| `fullyParallel: true` | Parallel within files |
| `npx playwright install chromium` | Skip Firefox/WebKit if untested |
| `retries: 2` | Auto-retry flakes (don't mask real bugs!) |

---

## Best Practices

1. **Always shard for >100 tests**, drastic speedup
2. **Use blob reporter + merge-reports**, single HTML for all shards
3. **Upload artifacts on failure**, traces are gold
4. **Set `forbidOnly: !!process.env.CI`**, stops accidental commits
5. **Cache node_modules + browsers**, faster CI runs
6. **Don't run all browsers on every PR**, Chromium for PRs, all for nightly

---

## Anti-Patterns

```yaml
# ❌ BAD: Running on macOS
runs-on: macos-latest  # 10x more expensive

# ✅ GOOD
runs-on: ubuntu-latest
```

```yaml
# ❌ BAD: Installing all browsers always
- run: npx playwright install --with-deps

# ✅ GOOD: Only what you test
- run: npx playwright install chromium --with-deps
```

```typescript
// ❌ BAD: HTML reporter only on CI (no shard merge possible)
reporter: 'html',

// ✅ GOOD
reporter: process.env.CI ? [['blob'], ['github']] : 'html',
```
