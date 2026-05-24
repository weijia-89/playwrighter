# Getting Started, 5 Minute Path

Copy this guide to go from zero to passing test.

---

## Prereqs

- Node.js ≥ 18
- A web app to test (running on `localhost` or accessible URL)

---

## Step 1: Bootstrap (1 minute)

```bash
mkdir my-tests && cd my-tests

# Copy templates + quality tools from playwrighter
cp -r /path/to/playwrighter/templates/. .
cp -r /path/to/playwrighter/tools ./tools
chmod +x ./tools/validate-suite.sh

# Install
npm install

# Install browser
npx playwright install chromium --with-deps
```

---

## Step 2: Configure (1 minute)

Edit `.env`:
```bash
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=TestPass123!
```

Edit `playwright.config.ts` if your dev server command differs from `npm run dev`.

---

## Step 3: Write Your First Test (2 minutes)

Use codegen to generate locators:
```bash
npx playwright codegen http://localhost:3000
```

Click around your app; codegen writes test code in real time. Copy the relevant parts into `tests/specs/first.spec.ts`:

```typescript
import { test, expect } from '../fixtures';

test('[TC-001] Homepage loads @P0 @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
});
```

---

## Step 4: Run (30 seconds)

```bash
# Run all tests
npm test

# Or interactive UI mode (best DX)
npm run test:ui

# View report
npm run test:report
```

---

## Step 5: Validate Quality (30 seconds)

```bash
# Anti-pattern lint
./tools/validate-suite.sh ./tests

# Quality scorecard
node tools/score-tests.js ./tests
```

If both pass with no errors, you're at production quality.

---

## Next Steps

| Goal | Pattern file |
|------|--------------|
| Reuse login across tests | `patterns/authentication.md` |
| Test forms, buttons, links reliably | `patterns/locator-strategy.md` |
| Stop using `waitForTimeout()` | `patterns/waiting-timing.md` |
| Mock third-party APIs | `patterns/network-mocking.md` |
| Add a11y checks | `patterns/accessibility.md` |
| Run on CI with sharding | `patterns/ci-cd.md` |
| Generate tests with AI agents | `patterns/test-agents.md` |
| Test mobile + responsive | `patterns/mobile-responsive.md` |
| Test components (not E2E) | `patterns/component-testing.md` |
| Test OAuth / MFA flows | `patterns/oauth-mfa-sso.md` |

---

## Common First Errors

### "No tests found"
Check `testDir` in `playwright.config.ts` matches your file location.

### "Browser not installed"
```bash
npx playwright install chromium --with-deps
```

### "Cannot find module './fixtures'"
You skipped step 1's `cp -r templates/. .`, fixtures.ts must exist.

### Test passes locally, fails on CI
Read `patterns/debugging-traces.md`. Set `trace: 'on-first-retry'` in config (already in template).

### Flaky tests
Open `patterns/anti-patterns.md`. Search for `waitForTimeout`, `networkidle`, manual `isVisible()`.
