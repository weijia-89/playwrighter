---
description: Build, audit, or fix Playwright tests using the playwrighter skill
---

# Playwrighter Workflow

Run when the user invokes `/playwrighter` or asks to build/audit Playwright tests.

## Steps

1. Read `playwrighter/.claude/skills/playwrighter/SKILL.md` for the index of patterns and templates.

2. Determine the task type:
   - **New suite** → use `playwrighter/templates/` as starting point
   - **Audit existing** → run `playwrighter/tools/validate-suite.sh` then `playwrighter/tools/score-tests.js`
   - **Fix flake** → read `playwrighter/patterns/debugging-traces.md` and `playwrighter/patterns/anti-patterns.md`
   - **AI-driven generation** → read `playwrighter/patterns/test-agents.md`

3. Read the relevant task-specific pattern file(s) before writing code.

4. Write or modify tests following:
   - `playwrighter/templates/test-template.ts` shape
   - Locator priority: `getByRole > getByLabel > getByText > getByTestId > CSS`
   - Web-first assertions (`await expect(x).toBeVisible()`)
   - No `waitForTimeout`, `networkidle`, manual `isVisible()`, `page.pause()`, `test.only()`, `{ force: true }`, or `if (await ...)` conditionals

5. Validate the work:
   // turbo
   ```bash
   bash playwrighter/tools/validate-suite.sh ./tests
   ```

   // turbo
   ```bash
   node playwrighter/tools/score-tests.js ./tests --threshold=80
   ```

6. Report findings; offer to apply fixes if any errors/warnings remain.

## Common task entry points

| Task | Pattern |
|------|---------|
| Auth setup | `playwrighter/patterns/authentication.md` |
| OAuth/MFA/SSO | `playwrighter/patterns/oauth-mfa-sso.md` |
| Mocking APIs | `playwrighter/patterns/network-mocking.md` |
| Mobile/responsive | `playwrighter/patterns/mobile-responsive.md` |
| iframes (Stripe, etc.) | `playwrighter/patterns/iframes-and-frames.md` |
| Component tests | `playwrighter/patterns/component-testing.md` |
| Visual regression | `playwrighter/patterns/visual-regression.md` |
| Accessibility | `playwrighter/patterns/accessibility.md` |
| Performance | `playwrighter/patterns/performance.md` |
| CI/sharding | `playwrighter/patterns/ci-cd.md` |
| Reporters | `playwrighter/patterns/reporters.md` |
| Test Agents (planner/generator/healer) | `playwrighter/patterns/test-agents.md` |
