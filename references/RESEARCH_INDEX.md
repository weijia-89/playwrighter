# Research Index: Playwright Best Practices (2026)

**Sources scanned:** Official Playwright docs (playwright.dev), `mxschmitt/awesome-playwright`, community blogs (testdino, browserstack, mergify, momentic), Microsoft engineering practice notes.

**Date:** 2026-05-14

---

## Canonical Best Practices (from official docs)

### Testing Philosophy
- **Test user-visible behavior**, not implementation details. No CSS classes, internal state, or function names.
- **Test isolation**, each test runs in its own browser context (cookies, storage, etc.).
- **Avoid third-party dependencies**, use `page.route()` to mock external APIs.
- **Control your data**, staging environments, deterministic data.

### Locators
- **`getByRole()` is canonical primary**, auto-waits, retry-able, accessible.
- **Chaining + filtering**, `page.getByRole('listitem').filter({ hasText: 'Product 2' }).getByRole('button')`.
- **Avoid CSS/XPath chains**, `div > ul > li:nth-child(3)` is brittle.
- **Codegen**, `npx playwright codegen <url>` generates locators automatically.

### Assertions
- **Web-first assertions**, `await expect(locator).toBeVisible()` (auto-retries).
- **Anti-pattern**, `expect(await locator.isVisible()).toBe(true)` (no auto-retry).
- **Soft assertions**, `expect.soft()` for multiple non-blocking checks.

### Configuration
- **`fullyParallel: true`**, parallel within file
- **`forbidOnly: !!process.env.CI`**, block accidental `.only`
- **`retries: process.env.CI ? 2 : 0`**, retry only on CI
- **`trace: 'on-first-retry'`**, record trace only when retrying
- **`baseURL`**, for relative `page.goto('/')`
- **`webServer`**, auto-start dev server before tests

### CI/CD
- **Sharding**, `--shard=1/4` for parallel execution across machines
- **Blob reports**, `reporter: process.env.CI ? 'blob' : 'html'`, then merge
- **`merge-reports`**, combine shard outputs into single HTML report
- **Linux on CI**, cheaper, install only browsers needed

---

## Fixtures (Killer Feature)

### Why Fixtures > beforeEach/afterEach
- Encapsulate setup + teardown in one place
- Reusable across files (export from custom `test`)
- On-demand (only requested fixtures run)
- Composable (depend on each other)
- No more `describe()` wrapping for setup

### Fixture Scopes
- **`test` (default)**, runs per test
- **`worker`**, runs once per worker process; ideal for accounts/services
- **`auto`**, always runs, even without explicit request

### Pattern
```ts
import { test as base } from '@playwright/test';
import { TodoPage } from './todo-page';

type Fixtures = { todoPage: TodoPage };

export const test = base.extend<Fixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await use(todoPage);
    await todoPage.removeAll();
  },
});
export { expect } from '@playwright/test';
```

---

## Page Object Model

### Modern Pattern (Playwright-style POM)
- Class with `Page` reference
- Locators stored as `readonly Locator` properties (not strings)
- Action methods (e.g., `addToDo(text)`)
- No assertions inside POM (assertions live in tests, except for sanity checks during navigation)

### Combine POM + Fixtures
- Best practice: POM classes + fixture that instantiates them
- Test files import custom `test` and get POM instances injected

---

## API Mocking (`page.route()`)

### Key Patterns
- **Full mock**, `route.fulfill({ json: data })` (no real call)
- **Modify response**, `await route.fetch()` then patch JSON, then `route.fulfill({ response, json })`
- **HAR replay**, `page.routeFromHAR()` records once, replays in tests
- **Apply at context level**, `context.route()` for shared mocks across pages
- **WebSocket mocking**, `page.routeWebSocket()` (newer feature)

### When to Mock
- Third-party APIs (don't test what you don't control)
- Slow/unreliable backends
- Edge cases (errors, empty states)
- Offline testing

---

## Authentication (4 Tiers)

### Tier 1: Shared account (basic)
- `auth.setup.ts` runs once, saves `playwright/.auth/user.json`
- All tests use `storageState: 'playwright/.auth/user.json'` in config
- `setup` project as dependency

### Tier 2: One account per worker (moderate)
- Worker-scoped fixture creates unique account using `parallelIndex`
- Each worker authenticates once, all tests in that worker share state
- For tests that mutate server state

### Tier 3: Multiple roles (advanced)
- Setup project authenticates as admin AND user
- Tests use `test.use({ storageState: 'admin.json' })` per file/group

### Tier 4: API-based authentication
- Skip UI, hit auth endpoint directly via `request` context
- Saves browser launch time (huge speedup)

### Critical
- **`playwright/.auth/`** is canonical directory (NOT `.auth/`)
- **Always gitignore** `playwright/.auth/`
- **Don't use SAME account for parallel mutating tests**

---

## Visual Regression

### `toHaveScreenshot()`
- First run: generates baseline at `<test>.spec.ts-snapshots/<name>-<browser>-<os>.png`
- Subsequent runs: compares pixel-by-pixel
- Update: `npx playwright test --update-snapshots`

### Stability Tips
- **`maxDiffPixels: 100`**, allow tolerance
- **`stylePath`**, apply CSS to hide volatile elements (iframes, animations)
- **Same OS on CI as baseline**, mac vs linux render differently
- **Per-platform baselines**, `chromium-darwin.png` vs `chromium-linux.png`
- **`mask: [locator]`**, hide dynamic regions (timestamps, ads)
- **`animations: 'disabled'`**, freeze CSS animations

---

## Trace Viewer

### Configuration
- **CI:** `trace: 'on-first-retry'` (recommended) or `'retain-on-failure'`
- **Local debugging:** `--trace on` flag or UI mode
- **Never `'on'` in production**, performance heavy

### What's Captured
- DOM snapshots per action
- Network requests
- Console logs
- Source code with action highlighting
- Time-travel screenshots

### Open
- `npx playwright show-trace trace.zip`
- `https://trace.playwright.dev` (drag-and-drop)

---

## Accessibility Testing

### Pattern: `@axe-core/playwright`
```ts
import AxeBuilder from '@axe-core/playwright';

test('a11y', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### Best Practices
- Use shared fixture for AxeBuilder configuration
- Tag with WCAG levels you care about
- Exclude known-issue elements with `.exclude(selector)`
- Attach scan results to test report

---

## Anti-Patterns (Documented)

| Anti-pattern | Why bad | Replacement |
|--------------|---------|-------------|
| `waitForTimeout(5000)` | Flaky, slow | Web-first assertions |
| `waitForLoadState('networkidle')` | SPAs never reach idle | `domcontentloaded` + element wait |
| `page.locator('div > .btn')` | Breaks on CSS refactor | `getByRole()` |
| `expect(await x.isVisible()).toBe(true)` | No auto-retry | `await expect(x).toBeVisible()` |
| Sharing state between tests | Cascading failures | Test isolation |
| Testing third-party UIs | Out of your control | Mock with `page.route()` |
| `page.click('text=Submit')` (deprecated) | Old syntax | `page.getByRole('button', {name:'Submit'})` |
| Multiple `page.waitForSelector` calls | Slow & flaky | Single web-first assertion |
| `page.screenshot()` for assertions | Manual diff | `expect(page).toHaveScreenshot()` |

---

## Configuration Defaults (Recommended)

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['blob'], ['github']] : 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

---

## Key Tools / Innovations to Adopt

1. **UI Mode** (`npx playwright test --ui`), time-travel debugging while coding
2. **Codegen** (`npx playwright codegen`), auto-generate locators
3. **VS Code extension**, debug, run, generate inline
4. **Playwright MCP**, AI agent integration
5. **`@axe-core/playwright`**, accessibility scans
6. **`merge-reports`**, combine sharded CI runs
7. **Component testing**, `@playwright/experimental-ct-react` etc.
8. **`expect(page).toHaveURL()`**, auto-retrying URL assertion
9. **`test.step()`**, break tests into named steps for tracing
10. **`test.fixme()` / `test.skip()` / `test.fail()`**, explicit known-failure tracking

---

## Innovations from Community Repos

### Authentication
- **API-based auth fixture**, bypass UI for speed
- **Per-role storageState files**, `admin.json`, `user.json`, `guest.json`
- **JWT/Cookie injection via `request` context**, fastest auth

### Test Data
- **Faker.js for unique data**, `faker.internet.email()` per test
- **Factory functions**, `createUser({ role: 'admin' })`
- **Fixture-scoped data cleanup**, auto-teardown via `await use()` pattern

### Reporting
- **Allure plugin**, rich reports
- **Currents/Sorry-Cypress alternatives**, TestDino, Argos for visual diffs
- **GitHub Action annotations**, `reporter: 'github'`

### Patterns from `awesome-playwright`
- **`playwright-bdd`**, Cucumber-style BDD
- **`expect-playwright`**, extra matchers
- **`playwright-lighthouse`**, performance budgets in tests
- **`storybook-test-runner`**, visual testing of Storybook

---

## Sources

- https://playwright.dev/docs/best-practices
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/pom
- https://playwright.dev/docs/auth
- https://playwright.dev/docs/mock
- https://playwright.dev/docs/test-snapshots
- https://playwright.dev/docs/trace-viewer
- https://playwright.dev/docs/accessibility-testing
- https://playwright.dev/docs/test-sharding
- https://playwright.dev/docs/test-configuration
- https://github.com/mxschmitt/awesome-playwright
- https://testdino.com/blog/playwright-automation-checklist/
- https://mergify.com/learn/flaky-tests/playwright/
