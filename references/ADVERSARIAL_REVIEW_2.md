# Adversarial Review #2 (Post-Build)

**Reviewer stance:** Hostile. Same project, post-overhaul. Find what's still broken, half-baked, or wrong.

**Method:** File-by-file inspection + cross-reference against official Playwright docs.

---

## CRITICAL FAILURES

### 1. `templates/test-template.ts` references nonexistent POMs

```typescript
import { test, expect } from './fixtures';
// uses loginPage, cartPage, checkoutPage
```

But:
- `templates/fixtures.ts` only declares `loginPage` and `dashboardPage` (cartPage/checkoutPage are commented out)
- `templates/pages/` directory doesn't exist
- The example imports `LoginPage` and `DashboardPage` from `./pages/login-page`, those files don't exist

**An agent copying these templates will have broken imports.**

### 2. `templates/fixtures.ts` imports nonexistent files

```typescript
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';
```

These files don't exist. The template won't compile.

### 3. `auth.setup.ts` uses both URL wait AND visibility wait without explanation

```typescript
await page.waitForURL('**/dashboard');     // Option 1
await expect(page.getByTestId('user-menu')).toBeVisible();  // Option 2
```

The comment says "two options" but the code uses BOTH. Either is fine; using both is harmless but confusing. An agent might think both are required.

### 4. `tools/validate-suite.sh` has a bug with `--strict` flag

```bash
TARGET="${1:-./tests}"
STRICT=0
[[ "${1:-}" == "--strict" ]] && { STRICT=1; TARGET="./tests"; }
```

If a user runs `./validate-suite.sh /path/to/tests --strict`, the script ignores `--strict` (only checks `$1`). The flag handling is broken.

### 5. `score-tests.js` regex misses common patterns

```javascript
const cssLocatorMatches = (content.match(/page\.locator\(['"][^'"]*[.#]/g) || []).length;
```

This catches `page.locator('.btn')` and `page.locator('#id')`, but misses:
- `page.locator('div.foo')` (tag with class)
- Nested locators: `parent.locator('.child')`
- Method chains: `frame.locator('.x')`

### 6. Hardcoded local-home paths still in SKILL.md

```markdown
**Location:** `<project>/playwrighter`
```

Same in INDEX.md integration section. Still non-portable.

### 7. INDEX.md references review files that don't all exist yet

INDEX.md says:
```
references/ADVERSARIAL_REVIEW_2.md
```
This file is being created right now, chicken-and-egg, but the index claims it exists.

### 8. No `.gitignore` in the project itself

The project itself has no `.gitignore`. Test users will commit `playwright/.auth/`, `node_modules/`, etc. if they copy this layout.

### 9. No `package.json` example

Templates assume `npm`, `dotenv`, `@axe-core/playwright`, but there's no `package.json` template. An agent setting up a new project from scratch has to figure out dependencies from prose.

### 10. `playwright.config.ts` template has dead code

```typescript
// Mobile (optional)
// {
//   name: 'mobile-chrome',
//   use: { ...devices['Pixel 7'] },
// },
```

Commented-out code is generally bad in templates. Either include it or document it elsewhere.

---

## SIGNIFICANT GAPS

### 11. No mention of `expect.toPass()`

`expect.toPass()` is the modern way to retry blocks of assertions. Not mentioned anywhere.

```typescript
await expect(async () => {
  const response = await fetch('/api/status');
  expect(response.status).toBe(200);
}).toPass();
```

### 12. No coverage of component testing

Playwright supports component testing (`@playwright/experimental-ct-react`). Briefly mentioned in research notes but no pattern file.

### 13. No mention of `test.describe.parallel()` vs `test.describe.serial()`

The test-structure.md mentions `test.describe.configure({ mode: 'parallel' })` but not the shorthand methods.

### 14. `network-mocking.md` doesn't show `request.url()` filtering

Common pattern: route handler that conditionally fulfills based on request:

```typescript
await page.route('**/api/**', async (route, request) => {
  if (request.url().includes('/users')) {
    await route.fulfill({ json: USERS });
  } else {
    await route.continue();
  }
});
```

Not shown.

### 15. No example of `test.info()` usage

For dynamic per-test data (timeouts, output dirs, attachments), `test.info()` is critical. Missing.

### 16. CI/CD pattern doesn't mention environment variables / secrets

GitHub Actions example has no example of using GitHub secrets for `TEST_USER_PASSWORD`. CI users will hit this.

### 17. No mention of Playwright MCP

Modern AI agent integration uses Playwright MCP (`@playwright/mcp`). Listed in research, not in patterns. May be intentional, but worth noting.

### 18. `accessibility.md` doesn't show how to fail on specific severity

axe-core has `impact` (minor/moderate/serious/critical). Common pattern: only fail on serious+. Not shown.

```typescript
const violations = results.violations.filter(
  v => v.impact === 'serious' || v.impact === 'critical'
);
expect(violations).toEqual([]);
```

### 19. No reference to Playwright version

Templates use TypeScript syntax that requires `@playwright/test` ≥ 1.40 or so. No `peerDependencies` or version note. Code may break on older versions.

### 20. RESEARCH_INDEX claims sources but no verification dates per claim

Unlike the user's `code-skills-overhaul/REFERENCES.md` (which has `Verified` dates per source), RESEARCH_INDEX has only one date (2026-05-14). Per-claim verification would be more rigorous.

---

## STYLE / CONSISTENCY

### 21. Mixed `expect` style in patterns

Some patterns use:
- `await expect(x).toBeVisible()`
- Others use: `await expect.soft(x).toBeVisible()`

Without explaining when to choose which. Could confuse readers.

### 22. Some pattern files have "Summary" sections, others don't

Inconsistent. Either every file gets one or none do.

### 23. `validate-suite.sh` colorizes but doesn't check `tput`

Color codes will print as garbage if stdout isn't a TTY (e.g., piped to a log file).

### 24. `score-tests.js` doesn't handle empty test files

If a `.spec.ts` file has 0 `test(` calls (e.g., a page object accidentally renamed), the test count is 0 but the file is still scanned. Should skip non-spec files.

---

## INACCURACIES

### 25. `network-mocking.md` says "set up before navigating"

```
**Note:** Set up the route **before** navigating.
```

This is correct for first-load behavior, but routes can be set up at any time and apply to subsequent requests. The phrasing is a half-truth.

### 26. `ci-cd.md` GitHub Actions example pins to `ubuntu-latest`

Best practice is to pin to a specific version (`ubuntu-22.04`) for reproducibility. Not done.

### 27. `auth.setup.ts` doesn't create the `.auth` directory

If `playwright/.auth/` doesn't exist when `storageState({ path })` runs, it can fail on some setups. Should `mkdir -p` first or rely on Playwright to handle it (it does, but no comment about this).

### 28. `fixtures.md` worker-scoped account fixture is not type-safe

```typescript
export const test = base.extend<{}, { account: Account }>({
```

The account creation calls `acquireAccount(id)` which is undefined in the snippet. Should note "implement your own".

---

## SCORE

| Aspect | Pre-fix | Post-fix |
|--------|---------|----------|
| Accuracy of content | 7/10 | 8/10 |
| Completeness vs PW best practices | 3/10 | 8/10 |
| Usability for AI agents | 2/10 | 7/10 |
| Portability | 3/10 | 4/10 |
| Innovation adoption | 2/10 | 8/10 |

**OVERALL: 7/10**, Solid improvement (3.4 → 7), but still has 10 critical bugs that will trip users.

---

## REQUIRED FIXES

### Tier 1 (must-fix before claiming done)
1. Create `templates/pages/login-page.ts` and `dashboard-page.ts`, make templates self-contained
2. Fix `validate-suite.sh` `--strict` flag handling
3. Fix `score-tests.js` regex to catch tag.class patterns
4. Remove local-home hardcoded paths from SKILL.md and INDEX.md
5. Add `.gitignore` to project root
6. Fix `auth.setup.ts` ambiguity (pick one wait approach in comment)
7. Add `package.json` template
8. Remove dead commented code from `playwright.config.ts`

### Tier 2 (should-fix)
9. Add `expect.toPass()` documentation
10. Add CI environment variables/secrets example
11. Add axe-core severity filtering example
12. Add Playwright version requirement note
13. Add `request.url()` conditional routing example
14. Pin GitHub Actions OS version

### Tier 3 (polish)
15. Add `tput` check to color codes
16. Make `score-tests.js` skip empty files
17. Standardize "Summary" sections across patterns
18. Add per-claim verification dates to RESEARCH_INDEX
