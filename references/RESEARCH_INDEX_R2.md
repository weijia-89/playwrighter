# Research Index Round 2, What Round 1 Missed

**Verified:** 2026-05-14

Round 1 covered the canonical core (locators, waits, assertions, fixtures, POM, mocking, auth, a11y, visual, traces, CI, API). Round 2 found **major gaps** the project had no coverage for.

---

## CRITICAL MISSES FROM ROUND 1

### 1. Playwright Test Agents (2026 feature) 🔥
Completely missed. Built into Playwright now: **🎭 Planner, 🎭 Generator, 🎭 Healer**.

| Agent | Role |
|-------|------|
| **Planner** | Explores the app, produces a Markdown test plan in `specs/` |
| **Generator** | Converts the plan into Playwright Test files |
| **Healer** | Auto-repairs failing tests (locator updates, wait adjustments) |

Convention:
```
repo/
├── .github/             # agent definitions
├── specs/               # human-readable test plans
│   └── basic-operations.md
├── tests/               # generated Playwright tests
│   ├── seed.spec.ts     # seed test (sets up environment)
│   └── create/add-valid-todo.spec.ts
└── playwright.config.ts
```

Source: https://playwright.dev/docs/test-agents

### 2. Component Testing
`@playwright/experimental-ct-react`, `-ct-vue`, `-ct-svelte`. Not mentioned anywhere.

```ts
test('Button click', async ({ mount }) => {
  let clicked = false;
  const component = await mount(<Button onClick={() => clicked = true}>Submit</Button>);
  await component.click();
  expect(clicked).toBeTruthy();
});
```

Source: https://playwright.dev/docs/test-components

### 3. Mobile / Device Emulation
The `devices` registry is huge. Round 1 mentions `devices['Desktop Chrome']` but not:
- `devices['iPhone 15']`, `devices['Pixel 7']`
- `viewport`, `userAgent`, `deviceScaleFactor`, `isMobile`, `hasTouch`
- `geolocation`, `locale`, `timezoneId`
- `colorScheme`, `prefersReducedMotion`
- `permissions`

Source: https://playwright.dev/docs/emulation

### 4. iframe / FrameLocator
Common scenario, completely missing.

```ts
const frame = page.frameLocator('iframe[name="payment"]');
await frame.getByLabel('Card number').fill('4242 4242 4242 4242');
await frame.getByRole('button', { name: 'Pay' }).click();
```

Source: https://playwright.dev/docs/api/class-framelocator

### 5. Test Data Factories + Faker
Industry-standard pattern; missing.

```ts
import { faker } from '@faker-js/faker';

export const userFactory = (overrides = {}) => ({
  email: faker.internet.email(),
  password: faker.internet.password({ length: 16 }),
  firstName: faker.person.firstName(),
  ...overrides,
});

// Per-test unique data
test('register', async ({ page, request }) => {
  const user = userFactory({ role: 'admin' });
  await request.post('/api/users', { data: user });
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
});
```

### 6. OAuth / SSO / MFA, Deep
Round 1 only had basic auth. Major missing topics:

| Topic | Pattern |
|-------|---------|
| **OAuth feature tests** | Mock with `page.route()` intercepting redirect |
| **OAuth integration tests** | Run separately, against real provider sandbox |
| **State param** | Mock MUST echo `state` from request URL or CSRF check fails |
| **PKCE** | Same, mock must respect `code_verifier` |
| **TOTP/MFA** | `otpauth` npm package generates valid codes |
| **TOTP timing** | Wait for fresh window if < 5s remaining |
| **Magic links** | API-generate token directly, skip email |
| **Multi-tenant** | One storageState per tenant; isolate via separate workers |
| **OAuth mocking server** | `oauth2-mock-server` for full integration testing |

Source: https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide

### 7. Performance Testing
Not covered. Two options:

| Tool | Approach |
|------|----------|
| `playwright-lighthouse` | Full Lighthouse audit (perf, a11y, SEO, best-practices) |
| `playwright-performance-metrics` | Real-time metrics during test run |

```ts
import playAudit from 'playwright-lighthouse';

test('homepage perf', async ({ playwright }) => {
  const browser = await playwright.chromium.launch({
    args: ['--remote-debugging-port=9222'],
  });
  const page = await browser.newPage();
  await page.goto('/');
  await playAudit({
    page,
    port: 9222,
    thresholds: { performance: 80, accessibility: 100 },
  });
});
```

### 8. ESLint Plugin
`eslint-plugin-playwright` enforces best practices automatically. Not mentioned.

```json
{
  "extends": ["plugin:playwright/recommended"],
  "rules": {
    "playwright/no-conditional-in-test": "error",
    "playwright/no-wait-for-timeout": "error",
    "playwright/no-networkidle": "error",
    "playwright/expect-expect": "error",
    "playwright/no-skipped-test": "warn"
  }
}
```

Source: https://github.com/playwright-community/eslint-plugin-playwright

### 9. Reporter Ecosystem
Round 1 mentions `html`, `blob`, `github`. Missing:

| Reporter | Use |
|----------|-----|
| `allure-playwright` | Industry-standard rich reports |
| `monocart-reporter` | HTML grid view, code coverage built-in |
| `playwright-ctrf-json-reporter` | CTRF schema for cross-tool integration |
| `playwright-slack-report` | Push results to Slack |
| `playwright-tesults-reporter` | Tesults TCMS integration |
| `playwright-xray` / `qase` | Jira Xray / Qase TCMS integration |

### 10. Network Caching
`playwright-network-cache` caches network responses to filesystem. Speeds up tests massively.

### 11. Cleanup Helpers
`playwright-cleanup` provides teardown utilities (delete test data created during tests).

### 12. Code Coverage
`@bgotink/playwright-coverage`, V8 coverage collection without instrumentation.

### 13. Screen Reader Testing
`@guidepup/Playwright`, drives VoiceOver and NVDA from Playwright. The only programmatic way to test screen reader behavior.

### 14. Global Worker Cache
`@global-cache/Playwright`, share data between parallel workers (e.g., one expensive setup, all workers use it).

### 15. Element/POM Frameworks
- `playwright-elements`, chainable component elements
- `POMWright`, TS-first POM with auto-generated nested locators
- `Serenity/JS`, Screenplay pattern
- `playwright-bdd`, Cucumber BDD with Playwright

### 16. Magic Steps
`playwright-magic-steps` auto-converts JS comments into `test.step()` calls. Reduces boilerplate.

### 17. CRX (Codegen Browser Extension)
Codegen as a Chrome extension for record-and-play in real environments.

---

## ANTI-PATTERNS NOT IN ROUND 1

From Currents.dev complete auth guide:

| Anti-pattern | Why bad |
|--------------|---------|
| Single shared test user across all tests | Workers fight over session state |
| Globally shared auth tokens (mid-run var) | Hidden cross-test dependency |
| Mocking OAuth as ONLY coverage | Misses redirect URI bugs, PKCE, scope errors |
| Testing only the happy path for auth | Lockouts, expired MFA, failed SSO unexposed |
| Leaving sessions in DB between runs | State pollution; use `testProject.outputDir` |
| Auth file outside `outputDir` | Manual cleanup; use `outputDir` (auto-cleaned) |
| Hardcoded TOTP secret | Must be env-only; rotate periodically |
| TOTP code with <5s remaining | Network latency expires it; regenerate |

---

## CONFIGURATION DETAILS NOT IN ROUND 1

### `expect.poll`
For polling assertions:
```ts
await expect.poll(async () => {
  const response = await request.get('/api/status');
  return response.status();
}, {
  intervals: [1_000, 2_000, 5_000],
  timeout: 60_000,
}).toBe(200);
```

### `test.beforeAll` / `test.afterAll` semantics
- Run once per worker file group
- Different from fixtures, use fixtures unless absolutely needed

### `test.slow()` / `test.fail()` / `test.skip()` with predicates
```ts
test.skip(({ browserName }) => browserName === 'webkit', 'WebKit issue');
test.fail(({ browserName }) => browserName === 'firefox', 'Known FF bug');
```

### `testInfo` properties
- `testInfo.parallelIndex`, worker number
- `testInfo.project.outputDir`, Playwright auto-cleans this
- `testInfo.attach()`, attach files to report
- `testInfo.annotations`, add metadata (e.g., Jira ticket)

### Storage state JSON shape
```json
{
  "cookies": [...],
  "origins": [{
    "origin": "https://app.example.com",
    "localStorage": [{ "name": "token", "value": "..." }]
  }]
}
```
Manually editable for advanced scenarios.

---

## NEW SOURCES (Round 2)

- https://playwright.dev/docs/test-agents
- https://playwright.dev/docs/test-components
- https://playwright.dev/docs/emulation
- https://playwright.dev/docs/api/class-framelocator
- https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide
- https://github.com/playwright-community/eslint-plugin-playwright
- https://www.npmjs.com/package/playwright-lighthouse
- https://github.com/Valiantsin2021/playwright-performance-metrics
- https://allurereport.org/docs/playwright/
- https://github.com/cenfun/monocart-reporter
- https://github.com/playwrightsolutions/playwright-api-test-demo (data factory)
- https://github.com/saffron-health/libretto (agent toolkit)
- https://github.com/currents-dev/playwright-best-practices-skill (competing skill, review for ideas)
