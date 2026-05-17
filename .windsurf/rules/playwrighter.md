---
trigger: model_decision
description: Generate production-quality Playwright tests using official best practices. Triggers on requests to build/write/generate Playwright or E2E tests, debug flaky tests, set up fixtures/POMs/auth, configure CI, add visual regression or a11y scans, or when editing files matching Playwright test patterns.
globs:
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/playwright.config.ts"
  - "**/playwright.config.js"
  - "**/tests/**/*.ts"
  - "**/e2e/**/*.ts"
---

# Playwrighter

**Canonical body:** `<workspace>/playwrighter/.claude/skills/playwrighter/SKILL.md`

Read the canonical SKILL.md and the relevant pattern file(s) before writing or modifying Playwright tests.

## Mandatory before writing/editing tests

1. Read `playwrighter/.claude/skills/playwrighter/SKILL.md` (full)
2. Read `playwrighter/patterns/locator-strategy.md`
3. Read `playwrighter/patterns/waiting-timing.md`
4. Read `playwrighter/patterns/anti-patterns.md`
5. Read the task-specific pattern from the index in `SKILL.md`

## Core invariants (NEVER break)

- Locator priority: `getByRole > getByLabel > getByText > getByTestId > CSS`
- NEVER `page.waitForTimeout()`
- NEVER `waitForLoadState('networkidle')`
- NEVER `expect(await x.isVisible()).toBe(true)`, use `await expect(x).toBeVisible()`
- NEVER `.toBeTruthy()` for UI assertions
- NEVER `test.only()` or `page.pause()` in committed code
- NEVER conditional branching in tests (`if (await ...)`), split into separate tests
- NEVER `{ force: true }` without justification

## Workflow

1. Read patterns relevant to the task
2. Use `templates/` as starting points (don't reinvent config/fixtures/POMs)
3. Write tests per `templates/test-template.ts` shape (AAA, `test.step`, tagged)
4. Validate with `tools/validate-suite.sh` and `tools/score-tests.js`
5. Reference 2026 features when appropriate: Test Agents, component testing, devices registry

## File map

```
playwrighter/
├── .claude/skills/playwrighter/SKILL.md   ← canonical body
├── patterns/                              ← 23 pattern files
├── templates/                             ← config, fixtures, POMs, test scaffold
├── tools/validate-suite.sh                ← anti-pattern linter
└── tools/score-tests.js                   ← 100-pt quality scorecard
```

For task-specific patterns, follow the index in `SKILL.md`.
