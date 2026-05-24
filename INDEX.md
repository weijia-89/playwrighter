# Playwrighter Index

**Quick reference for Playwright test patterns and workflows**

---

## Pattern Files (23 files)

### Core (always read)
| File | Purpose |
|------|---------|
| `patterns/locator-strategy.md` | Find elements: `getByRole > getByLabel > getByText > getByTestId > CSS` |
| `patterns/waiting-timing.md` | Waits: NEVER `waitForTimeout()` or `networkidle`; web-first assertions |
| `patterns/assertions.md` | Specific assertions, `expect.poll`, `expect.toPass` |
| `patterns/anti-patterns.md` | Consolidated reference of what NOT to do |

### AI-driven & Modern (2026)
| File | Purpose |
|------|---------|
| `patterns/test-agents.md` | 🎭 Planner/Generator/Healer agentic workflow |
| `patterns/component-testing.md` | `@playwright/experimental-ct-{react,vue,svelte}` |
| `patterns/eslint-and-linting.md` | `eslint-plugin-playwright` rules |

### Architecture
| File | Purpose |
|------|---------|
| `patterns/fixtures.md` | Custom fixtures; the killer Playwright feature |
| `patterns/page-object-model.md` | POM with `Locator` properties + fixture composition |
| `patterns/test-structure.md` | Naming, AAA, `test.step()`, `testInfo` API |
| `patterns/test-data.md` | Faker, factories, per-worker uniqueness |

### Authentication
| File | Purpose |
|------|---------|
| `patterns/authentication.md` | 4-tier strategy: shared → per-worker → multi-role → API |
| `patterns/oauth-mfa-sso.md` | OAuth mocking, TOTP/MFA, SSO/SAML, magic links |

### Specialized
| File | Purpose |
|------|---------|
| `patterns/network-mocking.md` | `page.route()`, HAR replay, third-party mocking |
| `patterns/iframes-and-frames.md` | FrameLocator, Stripe, shadow DOM |
| `patterns/mobile-responsive.md` | `devices` registry, geolocation, locale, viewport |
| `patterns/visual-regression.md` | `toHaveScreenshot()`, masking, per-platform baselines |
| `patterns/accessibility.md` | `@axe-core/playwright` + `@guidepup` screen reader |
| `patterns/performance.md` | `playwright-lighthouse`, Web Vitals, CPU/network throttling |
| `patterns/api-testing.md` | `request` fixture, hybrid API+UI tests |

### Operations
| File | Purpose |
|------|---------|
| `patterns/debugging-traces.md` | Trace viewer, UI mode, Inspector, `test.step()` |
| `patterns/ci-cd.md` | Sharding, GitHub Actions, blob reports, merge-reports |
| `patterns/reporters.md` | Allure, monocart, Slack, CTRF, custom reporters |

---

## Templates

| File | Purpose |
|------|---------|
| `templates/playwright.config.ts` | Recommended config (parallel, retries, trace, sharding-ready) |
| `templates/test-template.ts` | Test file scaffold with AAA + `test.step()` examples |
| `templates/auth.setup.ts` | Setup project for storageState reuse |
| `templates/fixtures.ts` | Custom fixtures with POM injection |
| `templates/test-plan-template.md` | Test plan with risk assessment + matrix |

---

## Tools

| File | Purpose |
|------|---------|
| `tools/validate-suite.sh` | Lint suite for anti-patterns (waitForTimeout, etc.) |
| `tools/score-tests.js` | 100-point quality scorecard implementation |

---

## Quick Patterns

### Locators (Priority Order)
```typescript
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('user@example.com');
await page.getByText('Success', { exact: true });
await page.getByTestId('submit-btn').click();           // only when explicit
await page.locator('.btn-primary').click();             // last resort + TODO
```

### Waits
```typescript
// ✅ Web-first
await expect(page.getByText('Loaded')).toBeVisible();

// ✅ SPA navigation
await page.goto(url, { waitUntil: 'domcontentloaded' });
await expect(page.getByRole('heading').first()).toBeVisible();

// ❌ NEVER
await page.waitForTimeout(5000);
await page.waitForLoadState('networkidle');
```

### Assertions
```typescript
// ✅ Specific + auto-retry
await expect(page.getByText('Success')).toBeVisible();
await expect(page).toHaveURL(/.*dashboard/);
await expect(page.getByLabel('Email')).toHaveValue('user@example.com');

// ❌ Manual / generic
expect(await page.getByText('x').isVisible()).toBe(true);
expect(await page.locator('button').count()).toBeTruthy();
```

### Test Structure
```typescript
import { test, expect } from './fixtures';

test('[TC-001] User can login @P0 @smoke', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@example.com', 'TestPass123!');

  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

### Fixtures + POM
```typescript
// fixtures.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});
export { expect };
```

---

## Anti-Patterns (NEVER)

```typescript
await page.waitForTimeout(5000);                          // fixed wait
await page.waitForLoadState('networkidle');               // SPA killer
await page.locator('div > ul > li:nth-child(3)').click(); // brittle CSS
await page.getByRole('button').click();                   // missing assertion
expect(await x.isVisible()).toBe(true);                   // manual, no retry
expect(...).toBeTruthy();                                 // generic
```

---

## Quality Scoring

**Run:** `node tools/score-tests.js ./tests`

**Target:** 80+/100

| Category | Weight |
|----------|--------|
| Reliability | 25% |
| Completeness | 25% |
| Maintainability | 20% |
| Execution | 15% |
| Coverage | 15% |

See the rubric comment block in `tools/score-tests.js` for penalty tables, thresholds, and limitations (canonical; matches `scoreFile()`).

---

## Workflow

1. **Explore**, manually use the application
2. **Plan**, fill in `templates/test-plan-template.md`
3. **Generate**, `npx playwright codegen <url>` for locators
4. **Build**, copy `templates/test-template.ts`, follow patterns
5. **Validate**, `tools/validate-suite.sh` and `tools/score-tests.js`
6. **Iterate**, UI mode (`--ui`), trace viewer for failures

---

## Integration

### Reference patterns from your project
```bash
# Symlink canonical skill (run from playwrighter root; adjust target dir for your agent)
mkdir -p <your-agent-skills>/playwrighter
ln -sf "$(pwd)/skill/SKILL.md" \
      <your-agent-skills>/playwrighter/SKILL.md

# Or copy patterns only
cp -r patterns/ <your-project>/qa-patterns/
```

### Reference in agent project docs
```markdown
## QA Patterns
See: <path-to-playwrighter>/patterns/
Skill: <path-to-playwrighter>/skill/SKILL.md
```

---

## Files Inventory

```
playwrighter/
├── skill/SKILL.md             # Canonical agent skill body
├── patterns/                  # 23 pattern files
├── templates/                 # 8 ready-to-copy templates
├── tools/                     # validate-suite.sh + score-tests.js (inline rubric)
├── INDEX.md                   # This file
└── README.md                  # Entry point
```

---

**Version**: 3.1.1
**Updated**: 2026-05-24
