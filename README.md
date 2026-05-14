# Playwrighter - Playwright Test Harness & Best Practices

**Production-ready Playwright test generation and execution framework**

Combines enterprise QA best practices from:
- **Intuit QualityForge** - Test generation, validation, best practices
- **Mailchimp Playwright patterns** - Real production patterns from 5,263+ tests
- **MC QA Tools** - QA workflows, issue taxonomy, severity rubrics

---

## What This Provides

### For AI Agents
A comprehensive skill (`/.claude/skills/playwrighter/SKILL.md`) that guides production-quality Playwright test generation with:
- Mandatory patterns (locators, waits, assertions)
- Anti-patterns to avoid
- Quality scoring rubric
- Test structure templates

### For Developers
Reusable patterns, templates, and tools for building reliable E2E test suites that:
- Pass consistently (no flaky tests)
- Use accessible locators (better for users AND tests)
- Follow enterprise best practices
- Score 80+/100 on quality metrics

---

## Quick Start

### For AI Agents

When asked to build Playwright tests:

1. **Invoke the skill**: Read `/.claude/skills/playwrighter/SKILL.md`
2. **Load patterns**: Read relevant files from `/patterns/`
3. **Follow the workflow**: Explore → Plan → Build → Validate
4. **Apply quality gates**: Score tests, ensure no anti-patterns

### For Developers

```bash
# Clone or reference this repo
git clone /Users/wjia/Projects/playwrighter

# Copy patterns to your test project
cp -r patterns/ your-project/qa-patterns/

# Use templates
cp templates/test-template.ts your-project/tests/

# Reference best practices
cat patterns/locator-strategy.md
```

---

## Structure

```
playwrighter/
├── .claude/skills/playwrighter/
│   └── SKILL.md                    # AI agent skill definition
├── patterns/
│   ├── locator-strategy.md         # How to find elements (priority order)
│   ├── waiting-timing.md           # Waits, timeouts, SPA handling
│   ├── assertions.md               # Specific vs generic assertions
│   ├── authentication.md           # Login strategies, session reuse
│   └── test-structure.md           # Arrange-Act-Assert, test IDs
├── templates/
│   ├── test-template.ts            # Standard test file template
│   ├── test-plan-template.md      # Test planning template
│   └── playwright.config.ts        # Recommended config
├── tools/
│   ├── validate-suite.sh           # Check for anti-patterns
│   └── score-tests.js              # Quality scoring
├── references/
│   ├── quality-scorecard.md        # 100-point scoring rubric
│   └── issue-taxonomy.md           # QA issue categorization
└── README.md                       # This file
```

---

## Core Principles

### 1. Reliability Over Speed
- Tests must be deterministic and repeatable
- Zero false positives - tests only fail when genuinely broken
- Explicit waits over fixed timeouts

### 2. Accessibility-First Locators
**Priority order**:
1. `getByRole()` - HIGHEST (buttons, links, headings)
2. `getByLabel()` - Form inputs
3. `getByText()` - Visible text
4. `getByTestId()` - Only when explicitly mentioned
5. `locator()` - LAST RESORT

### 3. Zero False Positives
- Always assert expected results explicitly
- Use specific assertions (`toBeVisible()`, not `.toBeTruthy()`)
- One logical assertion per test

### 4. Clean Test Structure
- Arrange-Act-Assert pattern
- Test IDs: `[TC-XXX] Description @Priority`
- Group with `describe()`, setup with `beforeEach()`

---

## Anti-Patterns (NEVER)

```typescript
// ❌ NEVER: Fixed timeouts
await page.waitForTimeout(5000);

// ❌ NEVER: networkidle for SPAs
await page.waitForLoadState('networkidle');

// ❌ NEVER: Brittle CSS selectors
await page.locator('div > ul > li:nth-child(3)').click();

// ❌ NEVER: Missing assertions
await page.getByRole('button').click();
// Missing: await expect(page.getByText('Success')).toBeVisible();
```

---

## Quality Gates

Before tests are "done":
- [ ] All tests pass consistently (3+ runs)
- [ ] No `waitForTimeout()` or `networkidle`
- [ ] Accessible locators used (role > label > text)
- [ ] Assertions are specific and meaningful
- [ ] Test isolation verified
- [ ] Quality score ≥80/100 per test
- [ ] README with setup instructions

---

## Integration

### Link to Existing Projects

```bash
# In your test project
ln -s /Users/wjia/Projects/playwrighter/.claude/skills/playwrighter \
      .claude/skills/playwrighter

# Or copy patterns
cp -r /Users/wjia/Projects/playwrighter/patterns \
      your-project/qa-patterns
```

### Reference in CLAUDE.md

```markdown
## QA Automation

This project uses Playwrighter best practices.
See: /Users/wjia/Projects/playwrighter/patterns/
```

---

## Sources

### QualityForge
- `/Users/wjia/Projects/qe-suite/qualityforge/playwright/PLAYWRIGHT-BEST-PRACTICES.md`
- 802 lines of Playwright best practices
- Test generation patterns
- Validation and scoring

### Mailchimp
- `/Users/wjia/Projects/mailchimp-r-and-a-qa-suite/`
- 5,263+ production tests
- SPA navigation patterns (verified: networkidle = 100% timeout)
- Page Object Models

### MC QA Tools
- `/Users/wjia/Projects/mc-qa-tools/`
- QA workflows and rubrics
- Issue taxonomy and severity levels
- Login strategies

---

## Evidence-Based Patterns

All patterns are backed by evidence:

**SPA Navigation** (Mailchimp):
- 5,263 tests using `networkidle` → 100% timeout rate
- Same tests using `domcontentloaded` + element wait → 98.4% pass rate

**Accessible Locators** (QualityForge + Mailchimp):
- 127+ Mailchimp test files use `getByRole()` as primary locator
- Verified across production codebases

**Quality Scoring** (QualityForge):
- 100-point rubric across 5 categories
- Gates: 70+ for merge, 80+ for production

---

## Next Steps

1. **Read the skill**: `/.claude/skills/playwrighter/SKILL.md`
2. **Browse patterns**: `/patterns/*.md`
3. **Apply to your project**: Use templates and validation tools
4. **Score your tests**: Target 80+/100

---

**Version**: 1.0.0
**Last Updated**: 2026-05-14
**Maintained**: This is a reference project, patterns are stable
