---
name: playwrighter
description: Production-quality Playwright test generation and execution harness. Combines Intuit QualityForge, Mailchimp, and mc-qa-tools best practices for reliable E2E testing.
---

# Playwrighter

**Purpose**: Build production-ready Playwright test suites following enterprise QA best practices from Intuit QualityForge, Mailchimp Playwright patterns, and MC QA Tools.

**Location**: `/Users/wjia/Projects/playwrighter`

---

## When to Use

Invoke when:
- "Build a Playwright test suite"
- "Create E2E tests for..."
- "Generate automated tests"
- "Set up QA automation"
- User mentions Playwright, E2E testing, or test automation

---

## Core Principles (Mandatory)

### 1. Reliability Over Speed
- Tests must be deterministic and repeatable
- Zero false positives - tests only fail when genuinely broken
- Explicit waits over fixed timeouts
- Proper test isolation

### 2. Accessibility-First Locators
**Priority order** (ALWAYS follow):
1. `getByRole()` - HIGHEST (buttons, links, headings)
2. `getByLabel()` - Form inputs
3. `getByText()` - Visible text with `{ exact: true }`
4. `getByTestId()` - Only when explicitly mentioned
5. `locator()` - LAST RESORT (add TODO comment)

### 3. Zero False Positives
- Always assert expected results explicitly
- Use specific assertions (`toBeVisible()`, `toHaveText()`, not `.toBeTruthy()`)
- One logical assertion per test

### 4. Clean Test Structure
- Arrange-Act-Assert pattern
- Test IDs in format: `[TC-XXX] Description @Priority`
- Group related tests in `describe()` blocks
- Use `beforeEach()` for common setup

---

## Anti-Patterns (NEVER)

```typescript
// ❌ NEVER use fixed timeouts
await page.waitForTimeout(5000);

// ❌ NEVER use networkidle for SPA apps
await page.waitForLoadState('networkidle');

// ❌ NEVER use brittle CSS selectors
await page.locator('div > ul > li:nth-child(3)').click();

// ❌ NEVER skip assertions
await page.getByRole('button').click();
// Missing: await expect(page.getByText('Success')).toBeVisible();

// ❌ NEVER write overly long tests
// One test = one scenario
```

---

## References

Built from:
- **QualityForge**: `/Users/wjia/Projects/qe-suite/qualityforge/playwright/PLAYWRIGHT-BEST-PRACTICES.md`
- **Mailchimp**: `/Users/wjia/Projects/mailchimp-r-and-a-qa-suite/TEST_QUALITY_SCORECARD.md`
- **MC QA Tools**: `/Users/wjia/Projects/mc-qa-tools/qa/references/`

Full patterns indexed in:
- `./patterns/locator-strategy.md`
- `./patterns/waiting-timing.md`
- `./patterns/assertions.md`
- `./patterns/authentication.md`
- `./patterns/test-structure.md`
- `./patterns/anti-patterns.md`

---

## Workflow

1. **Read requirements** - Understand what to test
2. **Explore application** - Manually verify critical flows
3. **Generate test plan** - Map user journeys to test cases
4. **Write tests** - Follow patterns from `./patterns/`
5. **Validate** - Run tests, check for flakiness
6. **Score** - Apply quality scorecard (target: 80+/100)

---

## Quality Gates

Before considering tests "done":
- [ ] All tests pass consistently (3+ runs)
- [ ] No `waitForTimeout()` or `networkidle`
- [ ] Accessible locators used (role > label > text)
- [ ] Assertions are specific and meaningful
- [ ] Test isolation verified (tests don't depend on each other)
- [ ] Quality score ≥80/100 per test
- [ ] README with setup instructions included

---

## Next Steps

After invoking this skill:
1. Read `/Users/wjia/Projects/playwrighter/patterns/*.md` for detailed guidance
2. Check project requirements
3. Generate test plan following `./templates/test-plan-template.md`
4. Build tests using `./templates/test-template.ts`
5. Validate with `./tools/validate-suite.sh`
