# Playwrighter, Playwright Best Practices Reference

**Production-ready patterns, templates, and validation tools for Playwright test suites.**

Sourced from official Playwright docs, [`mxschmitt/awesome-playwright`](https://github.com/mxschmitt/awesome-playwright), and verified community patterns.

---

## What's Here

### For AI agents
Multi-tool skill that loads patterns and enforces best practices when generating Playwright tests:
- **Claude**, `.claude/skills/playwrighter/SKILL.md`
- **Cursor**, `.cursor/rules/playwrighter.mdc`
- **Windsurf**, `.windsurf/rules/playwrighter.md` + `/playwrighter` slash command

### For developers
- **23 pattern files** covering everything from locators to AI test agents
- **8 ready-to-copy templates** (config, fixtures, auth setup, POMs, test scaffold, test plan, package.json)
- **2 validation tools** (anti-pattern linter + quality scorecard)
- **Research index** with primary-source citations from official docs + community

---

## Quick Start

### Read the patterns
Start with `INDEX.md` for an overview, then drill into:
- `patterns/locator-strategy.md`, accessible locators
- `patterns/fixtures.md`, Playwright's killer feature
- `patterns/anti-patterns.md`, what to avoid

### Use the templates
```bash
cp templates/playwright.config.ts your-project/
cp templates/auth.setup.ts your-project/tests/
cp templates/fixtures.ts your-project/tests/
```

### Validate your suite
```bash
./tools/validate-suite.sh ./your-tests
node tools/score-tests.js ./your-tests --threshold=80
```

---

## Structure

```
playwrighter/
├── .claude/skills/playwrighter/SKILL.md   # Claude skill (canonical body)
├── .cursor/rules/playwrighter.mdc         # Cursor rule
├── .windsurf/rules/playwrighter.md        # Windsurf rule
├── .windsurf/workflows/playwrighter.md    # Windsurf /playwrighter slash command
├── patterns/                              # 23 pattern files
│   ├── locator-strategy.md
│   ├── waiting-timing.md
│   ├── assertions.md
│   ├── anti-patterns.md
│   ├── test-agents.md                     # 🎭 Planner/Generator/Healer
│   ├── component-testing.md
│   ├── eslint-and-linting.md
│   ├── fixtures.md
│   ├── page-object-model.md
│   ├── test-structure.md
│   ├── test-data.md                       # Faker, factories
│   ├── authentication.md
│   ├── oauth-mfa-sso.md                   # OAuth, TOTP, SAML
│   ├── network-mocking.md
│   ├── iframes-and-frames.md
│   ├── mobile-responsive.md
│   ├── visual-regression.md
│   ├── accessibility.md                   # axe + guidepup
│   ├── performance.md                     # Lighthouse, Web Vitals
│   ├── api-testing.md
│   ├── debugging-traces.md
│   ├── ci-cd.md
│   └── reporters.md                       # Allure, Slack, etc.
├── templates/
│   ├── playwright.config.ts
│   ├── test-template.ts
│   ├── auth.setup.ts
│   ├── fixtures.ts
│   ├── package.json
│   ├── test-plan-template.md
│   └── pages/
│       ├── login-page.ts
│       └── dashboard-page.ts
├── tools/
│   ├── validate-suite.sh                  # Anti-pattern linter
│   └── score-tests.js                     # Quality scorecard
├── references/
│   ├── RESEARCH_INDEX.md                  # Round 1, core practices
│   ├── RESEARCH_INDEX_R2.md               # Round 2, agents, components, ecosystem
│   ├── quality-scorecard.md               # Rubric
│   └── ADVERSARIAL_REVIEW_{1..4}.md       # Audit trail
├── INDEX.md                               # Quick reference
└── README.md                              # This file
```

---

## Core Principles

1. **Test user-visible behavior**, not implementation details
2. **Use accessible locators**, `getByRole > getByLabel > getByText > getByTestId > CSS`
3. **Web-first assertions**, `await expect(x).toBeVisible()` (auto-retries)
4. **Fixtures over hooks**, encapsulate setup + teardown
5. **No fixed waits**, never `waitForTimeout()` or `networkidle`
6. **Test isolation**, each test gets a fresh context
7. **Mock third-party services**, don't test what you don't control

---

## Anti-Patterns (NEVER)

| ❌ | ✅ |
|----|----|
| `page.waitForTimeout(5000)` | `await expect(x).toBeVisible()` |
| `page.waitForLoadState('networkidle')` | `domcontentloaded` + element wait |
| `page.locator('.btn-primary')` | `page.getByRole('button', { name: 'Save' })` |
| `expect(await x.isVisible()).toBe(true)` | `await expect(x).toBeVisible()` |
| Test without assertion | Always `await expect(...)` after action |
| `.toBeTruthy()` | Specific matcher (`toHaveCount`, `toHaveText`) |

See `patterns/anti-patterns.md` for the full list.

---

## Quality Gates

Before tests are "done":

- [ ] All tests pass 3+ consecutive runs
- [ ] No `waitForTimeout()` or `networkidle` (run `tools/validate-suite.sh`)
- [ ] Accessible locators (codegen-verified)
- [ ] Specific assertions only
- [ ] Test isolation verified
- [ ] Quality score ≥ 80/100 (run `tools/score-tests.js`)
- [ ] README documents env vars + CI config

---

## Requirements

- **Node.js** ≥ 18
- **`@playwright/test`** ≥ 1.40 (templates use modern features)
- For accessibility patterns: **`@axe-core/playwright`** ≥ 4.10

See `templates/package.json` for a full dependency manifest.

---

## Sources

All patterns trace to primary sources:
- [Playwright Official Docs](https://playwright.dev)
- [`mxschmitt/awesome-playwright`](https://github.com/mxschmitt/awesome-playwright)
- See `references/RESEARCH_INDEX.md` for the full index

---

## Integration

The skill ships with invocation files for **Claude, Cursor, and Windsurf**. All three point at the same canonical body (`.claude/skills/playwrighter/SKILL.md`) and pattern files, pick whichever path your AI tool uses.

### Claude Code / Claude Desktop
Symlink the skill folder:
```bash
ln -s "$(pwd)/playwrighter/.claude/skills/playwrighter" \
      <your-project>/.claude/skills/playwrighter
```
Or per-user (global):
```bash
ln -s "$(pwd)/playwrighter/.claude/skills/playwrighter" \
      ~/.claude/skills/playwrighter
```
Claude auto-loads `SKILL.md` when its `description` field matches the user's request.

### Cursor
Symlink the rule:
```bash
mkdir -p <your-project>/.cursor/rules
ln -s "$(pwd)/playwrighter/.cursor/rules/playwrighter.mdc" \
      <your-project>/.cursor/rules/playwrighter.mdc
```
Or per-user:
```bash
ln -s "$(pwd)/playwrighter/.cursor/rules/playwrighter.mdc" \
      ~/.cursor/rules/playwrighter.mdc
```
Triggers via globs (`*.spec.ts`, `playwright.config.ts`, `tests/**/*.ts`) or model decision.

### Windsurf
Symlink the rule + workflow:
```bash
mkdir -p <your-project>/.windsurf/{rules,workflows}
ln -s "$(pwd)/playwrighter/.windsurf/rules/playwrighter.md" \
      <your-project>/.windsurf/rules/playwrighter.md
ln -s "$(pwd)/playwrighter/.windsurf/workflows/playwrighter.md" \
      <your-project>/.windsurf/workflows/playwrighter.md
```
Triggers as a model-decision rule, or via the `/playwrighter` slash command.

### Reference patterns in your project's AI rules
```markdown
## QA Automation Patterns
See: <path-to-playwrighter>/patterns/
```

### Verify
After symlinking, ask your AI tool: *"Write a Playwright test for the login flow."* It should read the canonical `SKILL.md` and the relevant pattern files before producing tests.

---

## Related portfolio repos

- **`weijia-89/vibe-check`**: scanner that surfaces hallucinated APIs and other LLM-tell patterns in PR diffs. Run any AI-generated test diff through `vibe-check` before merge.
- **`weijia-89/palamedes`**: rigorous-research skill plus multi-agent synthesis prompt. Same evidence-discipline shape applied to research output rather than test code.
- **`weijia-89/trainer.skill`**: routing skill for an 8-specialist agent toolkit. Loads this repo's patterns when the agent encounters Playwright trigger files (`*.spec.ts`, `playwright.config.ts`, etc.).
- **`weijia-89/northwind-qa`**: a 50-test Playwright suite that uses these patterns end-to-end. Worked example, not just a reference.

---

**Version**: 3.0.0
**Updated**: 2026-05-14
**Maintained**: Patterns are stable; updated when official Playwright guidance changes.
