---
name: playwrighter
description: Generate production-quality Playwright tests using official best practices. Triggers on requests to build, write, or generate Playwright/E2E tests.
---

# Playwrighter

**Purpose:** Build production-ready Playwright test suites following official best practices ([playwright.dev/docs/best-practices](https://playwright.dev/docs/best-practices)).

**Location:** This skill lives wherever the playwrighter repo is checked out; resolve paths relative to the skill file itself.

---

## When to Use

Invoke when the user asks to:
- Build / write / generate Playwright tests
- Set up E2E test automation
- Create test fixtures, page objects, or auth setup
- Configure Playwright (config, CI, sharding)
- Debug flaky tests
- Add visual regression / accessibility scans

---

## Mandatory Workflow

1. **Read patterns FIRST**, never write tests without consulting the relevant pattern files
2. **Use codegen for locators**, `npx playwright codegen <url>` over hand-written CSS
3. **Apply templates**, start from `templates/`, don't build from scratch
4. **Validate before declaring done**, run `tools/validate-suite.sh` and `tools/score-tests.js`

---

## Pattern Files (READ THESE)

For ANY Playwright task, read:
- `patterns/locator-strategy.md`, locator priority + codegen
- `patterns/waiting-timing.md`, web-first assertions, no fixed waits
- `patterns/assertions.md`, specific over generic
- `patterns/anti-patterns.md`, consolidated NEVERs

For specific tasks:
- **AI-driven test generation** → `patterns/test-agents.md` (planner/generator/healer)
- **Component tests** → `patterns/component-testing.md`
- **Fixtures / setup** → `patterns/fixtures.md`
- **Page objects** → `patterns/page-object-model.md`
- **Auth flows (basic)** → `patterns/authentication.md` (4-tier strategy)
- **OAuth / SSO / MFA** → `patterns/oauth-mfa-sso.md`
- **Mocking APIs** → `patterns/network-mocking.md`
- **iframes / Shadow DOM** → `patterns/iframes-and-frames.md`
- **Mobile / responsive** → `patterns/mobile-responsive.md`
- **Test data factories** → `patterns/test-data.md`
- **Test organization** → `patterns/test-structure.md`
- **Visual diff** → `patterns/visual-regression.md`
- **A11y (axe + screen reader)** → `patterns/accessibility.md`
- **Performance / Web Vitals** → `patterns/performance.md`
- **Debugging** → `patterns/debugging-traces.md`
- **CI/CD** → `patterns/ci-cd.md`
- **Reporters** → `patterns/reporters.md`
- **API tests** → `patterns/api-testing.md`
- **ESLint / linting** → `patterns/eslint-and-linting.md`

---

## Templates (USE THESE)

- `templates/playwright.config.ts`, recommended config
- `templates/auth.setup.ts`, storageState reuse pattern
- `templates/fixtures.ts`, POM injection via fixtures
- `templates/test-template.ts`, test file scaffold
- `templates/test-plan-template.md`, for planning new suites

---

## Core Principles (Mandatory)

### 1. Test User-Visible Behavior
Don't test CSS classes, internal state, or implementation. Test what users see + do.

### 2. Accessible Locators
```
getByRole > getByLabel > getByText > getByTestId > CSS (last resort)
```

### 3. Web-First Assertions
```typescript
// ✅
await expect(page.getByText('Welcome')).toBeVisible();

// ❌
expect(await page.getByText('Welcome').isVisible()).toBe(true);
```

### 4. Fixtures over Hooks
Encapsulate setup + teardown in fixtures. Compose POMs into them.

### 5. Test Isolation
Each test gets a fresh browser context. No shared state.

### 6. No Fixed Waits
NEVER `waitForTimeout()`. NEVER `waitForLoadState('networkidle')`.

### 7. Mock Third-Party Services
Use `page.route()` for any external dependency.

---

## Hard Bans (NEVER)

```typescript
await page.waitForTimeout(5000);                          // ❌
await page.waitForLoadState('networkidle');               // ❌
await page.locator('div > ul > li:nth-child(3)').click(); // ❌
expect(await x.isVisible()).toBe(true);                   // ❌
expect(...).toBeTruthy();                                 // ❌
test.only(...);                                           // ❌ (forbidden on CI)
```

---

## Output Requirements

Every Playwright test you generate must:

1. **Use custom fixtures** (`from './fixtures'`), not raw `@playwright/test`
2. **Have a [TC-XXX] ID** in the test name
3. **Tag priority + category** (`@P0 @smoke`, etc.)
4. **End with web-first assertion(s)** verifying the action's effect
5. **Use accessible locators** (codegen-verified)
6. **Pass validation**: `./tools/validate-suite.sh` returns 0
7. **Score ≥ 80/100**: `node tools/score-tests.js`

---

## Quality Gates

Before saying "done":
- [ ] All patterns relevant to the task were read
- [ ] Templates were used as starting points
- [ ] `validate-suite.sh` passes (no errors)
- [ ] `score-tests.js` reports ≥ 80
- [ ] Tests use fixtures, not raw `@playwright/test`
- [ ] No anti-patterns from `anti-patterns.md`
- [ ] README updated with env vars and run instructions

---

## References

- Official: https://playwright.dev/docs/best-practices
- Quality rubric: inline comment block in `tools/score-tests.js`
