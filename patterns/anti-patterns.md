# Anti-Patterns (Consolidated)

A single reference for what NOT to do, with replacements.

---

## Waiting

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| `await page.waitForTimeout(5000)` | `await expect(locator).toBeVisible()` | Fixed waits are slow + flaky |
| `await page.waitForLoadState('networkidle')` | `await page.waitForLoadState('domcontentloaded')` + element wait | SPAs with analytics never go idle |
| `setTimeout(...)` in tests | Web-first assertions | Same as above |
| `await page.waitForSelector('.x')` | `await expect(locator).toBeVisible()` | New API, better errors |

---

## Locators

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| `page.locator('div > .btn')` | `page.getByRole('button', { name: 'Save' })` | CSS breaks on refactor |
| `page.locator('xpath=//button[1]')` | `getByRole` / `getByLabel` | Brittle |
| `page.locator('.css-1abc234')` | Semantic locator | CSS-in-JS hashes change |
| `page.$('button')` (deprecated) | `page.locator('button')` or `getByRole` | Old API, no auto-wait |
| `page.click('text=Submit')` (string) | `page.getByText('Submit').click()` | Modern API |
| Long chains: `div > ul > li:nth-child(3) > a` | Filter: `getByRole('listitem').filter({ hasText: 'X' })` | Semantic + resilient |

---

## Assertions

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| `expect(await x.isVisible()).toBe(true)` | `await expect(x).toBeVisible()` | No auto-retry |
| `expect(await x.count()).toBeTruthy()` | `await expect(x).toHaveCount(n)` | Specific failure msg |
| `expect(await x.textContent()).toContain('y')` | `await expect(x).toContainText('y')` | Web-first assertion |
| `expect(locator);` (no matcher) | `await expect(locator).toBeVisible()` | Asserts nothing; the test cannot fail (`validate-suite.sh` errors on single-line form) |
| `test.fixme('x', () => {});` | Write the test, or delete it and track in a ticket | Reports as skipped, looks like coverage (`validate-suite.sh` warns) |
| `expect(await x.innerHTML()).toBe(...)` / `innerText()` / `inputValue()` | `await expect(x).toHaveText(...)` / `toHaveValue(...)` | Resolves once, no retry; `innerHTML` also couples to markup |
| `try { await expect(x).toBeVisible() } catch {}` | `expect.soft()`, `.not` for absence, or split into two tests | Swallows the failure; the test passes when it should fail |
| Asserting straight after a navigating click (`click()` then `expect(oldPageThing)`) | Assert the destination: `await expect(page).toHaveURL(...)` or a locator that only exists there | The assertion races the unload; a sleep only hides it |
| Action without assertion: `await btn.click()` (end of test) | Add `await expect(...)` after | Test passes if nothing happened |
| Test assertions inside POM (beyond `goto()` sanity checks) | Assertions in spec files; POM exposes actions/locators only | Couples POM to test intent |

---

## Network

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| Testing real third-party APIs | Mock with `page.route()` | Out of your control |
| Mocking after `page.goto()` | Mock before navigation | Race condition |
| `page.evaluate(() => window.api = mock)` | `page.route('**/api/**', ...)` | Mock at network boundary |
| Mocking your own backend in every test | Mock only third parties; run your own API for real (staging or local) | Mocks drift from the real API: green suite, broken product |
| Hardcoded API URLs in test data | Use `**/api/...` glob | Brittle to host changes |

---

## Test Isolation

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| Tests share state | Each test = new context | Cascading failures |
| Order-dependent tests (`test('1...'), test('2...')`) | Independent tests | Can't run in parallel |
| Reusing same account for parallel mutating tests | Worker-scoped account fixture | Race conditions |
| Global variables for state | Fixtures | Hidden coupling |
| `beforeAll` that creates state tests then mutate | `beforeEach` or a test-scoped fixture; `beforeAll` only for read-only setup, with `afterAll` cleanup | Worker-scoped state is shared; one test's edit breaks the next |

---

## Auth

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| Logging in `beforeEach` for every test | `storageState` reuse via setup project | Slow |
| `.auth/` folder | `playwright/.auth/` | Canonical path |
| Storing creds in test code | Env vars + `.env` (gitignored) | Security |
| UI login when API exists | API-based auth via `request` context | Faster |

---

## Configuration

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| `retries: 0` on CI | `retries: process.env.CI ? 2 : 0` | CI flakes happen |
| Same workers locally and CI | `workers: process.env.CI ? 4 : undefined` | CI has different resources |
| `trace: 'on'` | `trace: 'on-first-retry'` | Performance |
| No `forbidOnly` | `forbidOnly: !!process.env.CI` | Catch leftover `.only()` |
| No `baseURL` | Set in config | Reusable + readable |

---

## Visual Regression

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| Screenshots without animation handling | `animations: 'disabled'` | Frame jitter |
| Same baseline across OSes | Per-platform baselines (auto) | Different rendering |
| Comparing dynamic regions | `mask: [locator]` for timestamps | Volatile pixels |
| `toHaveScreenshot()` without tolerance | `maxDiffPixels: 100` for noise | Anti-aliasing varies |

---

## Test Code Quality

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| Massive single test (1000 lines) | Split + use `test.step()` | Readability |
| Copy-paste setup across files | Custom fixture | DRY |
| Magic numbers / strings | Constants + test data files | Maintainability |
| String locators in POM | `Locator` objects | Type safety + auto-wait |
| Console.log debugging | Trace viewer + UI mode | Better tools exist |
| Testing CSS class names | Test user-visible behavior | Implementation detail |
| Missing `await` on a Playwright call | `await` every call; lint `playwright/missing-playwright-await` | The next line runs before the action finishes; failures look random |
| `page.evaluate(() => el.click())` or DOM reads via `evaluate` | Locator methods (`click`, `fill`, `toHaveText`) | Skips auto-wait and actionability checks. Keep `evaluate` for computed styles and app hooks |
| `test.describe` nested 3+ deep | At most 2 levels; split files instead | Outer `beforeEach` hooks become invisible at the test (`playwright/max-nested-describe`) |
| Long test with no `test.step()` | Wrap each phase in `test.step()` | Trace and report show phases, not 50 raw actions |
| `if (await x.isVisible())` branching | Use specific tests for each case | Hides flakiness |

---

## CI/CD

| ❌ Anti-pattern | ✅ Replacement | Why |
|----------------|----------------|-----|
| Single CI job for full suite | Sharding via matrix | 4x speed |
| HTML reporter in CI | `'blob'` reporter + merge | Combines shard results |
| Installing all browsers on CI | `npx playwright install chromium --with-deps` | Faster, cheaper |
| Running on macOS CI | Linux | Cheaper |
| No artifact retention | Upload reports/traces | Debug failures later |

---

## Reference Quick-Filter

If you find yourself writing any of these, stop:

- `waitForTimeout`
- `networkidle`
- `.css-`, `nth-child`, `xpath=`
- `expect(await x.isVisible())`, `expect(await x.innerHTML())`
- `try { ... expect ... } catch`
- a Playwright call with no `await`
- `if (await page...)` for branching
- POM that imports `expect`
