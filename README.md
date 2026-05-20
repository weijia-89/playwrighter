# playwrighter

I built playwrighter as a Playwright pattern library plus a working test-quality scorer, so an AI agent or a human writing E2E tests has both the patterns to follow and an automated way to check whether the suite actually follows them. The patterns (23 of them under `patterns/`) come from Playwright's official docs, from mxschmitt/awesome-playwright, and from conventions I verified across community projects. The scorer at `tools/score-tests.js` reads a directory of `.spec.ts` files and grades them against a rubric that mirrors the patterns, so every anti-pattern documented in `patterns/anti-patterns.md` has a corresponding penalty in the scorer, from `waitForTimeout` calls down through CSS-selector locators where an accessible role would do better. The repo also ships 8 ready-to-copy templates under `templates/` (config, fixtures, auth setup, POMs, package.json) and a second validation tool, `tools/validate-suite.sh`, for the anti-pattern linter pass.

The skill ships as a multi-tool bundle pointing at the same canonical body. Claude loads `.claude/skills/playwrighter/SKILL.md`, Cursor loads `.cursor/rules/playwrighter.mdc`, and Windsurf loads `.windsurf/rules/playwrighter.md` plus a `/playwrighter` slash command. For human readers, `INDEX.md` is the entry point.

---

## Quick start

```bash
cp templates/playwright.config.ts your-project/
cp templates/auth.setup.ts your-project/tests/
cp templates/fixtures.ts your-project/tests/

./tools/validate-suite.sh ./your-tests
node tools/score-tests.js ./your-tests --threshold=80
```

Start reading from `INDEX.md` for the topic map, then drill into `patterns/locator-strategy.md` for accessible locators, `patterns/fixtures.md` for the fixture-over-hook pattern, and `patterns/anti-patterns.md` for the full list of what the scorer will penalize.

---

## Why a pattern library plus a scorer

A pattern library on its own is documentation, and documentation gets read once and then ignored when the agent or the engineer is moving fast. The discipline I wanted was the suite-quality bar that catches the regression at PR time, so I wrote the scorer to mirror the patterns directly. A `waitForTimeout(N)` call costs 8 points in the rubric, the same penalty for a `networkidle` wait, while a CSS-selector locator like `.btn-primary` costs 6 points, and the `expect(await x.isVisible()).toBe(true)` shape instead of `await expect(x).toBeVisible()` costs 5. The full rubric scores out of 100 and the default CI threshold is 80.

The scorer is intentionally regex-and-AST simple. It can't tell whether your test is meaningfully testing the right thing, and it doesn't catch the semantic anti-patterns that show up in code review (assertions that don't really constrain behavior, test names that misrepresent what the body asserts). What it does catch is the syntactic decay that creeps into a suite over time, from the flake-fix that introduced a `waitForTimeout` to the quick-locator shortcut that landed a CSS selector instead of an accessible role. Those are the regressions a code reviewer also misses when the diff is large and the time is short, and the scorer fails CI before the reviewer has to find them.

The 23 pattern files are the source the scorer's rules trace to. If the scorer penalizes `getByText` over `getByRole`, `patterns/locator-strategy.md` walks through why accessible roles are more stable than visible text. If it penalizes `waitForTimeout`, `patterns/waiting-timing.md` explains the auto-waiting mechanism that makes fixed waits the wrong abstraction. The library and the scorer share a vocabulary, so a contributor or an AI agent reading the SKILL ends up writing tests that pass the scorer because the patterns and the rubric are the same artifact.

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

## Worked example

[`weijia-89/northwind-qa`](https://github.com/weijia-89/northwind-qa) is the suite I built to dogfood playwrighter end-to-end. It's a 51-test Playwright run against a React 19 + Vite e-commerce SUT ([`example-e-commerce-website`](https://github.com/weijia-89/example-e-commerce-website)) that exercises the patterns under load: accessible-locator-first throughout, fixtures over hooks, web-first assertions, no fixed waits anywhere in the suite. Seven of those 51 tests are regression guards against bugs the suite caught while being written, filed under `bugs/` with reproduction steps.

The scorer's verdict on the suite:

```
$ git clone https://github.com/weijia-89/northwind-qa
$ node playwrighter/tools/score-tests.js northwind-qa/tests/ --threshold=80
Average: 91.4/100
Files below threshold: 0/10
```

If you want to see a suite that takes playwrighter's rubric seriously, that's the read. If you want to see how the patterns translate into real tests, the suite's `tests/cart.spec.ts` (storage-shape regression guards), `tests/auth.spec.ts` (storage-state setup project), and `tests/a11y.spec.ts` (axe sweep across routes) are the highest-leverage starting points.

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

playwrighter sits in a portfolio of QA-for-AI work. The two repos that pair most directly:

- **[`weijia-89/northwind-qa`](https://github.com/weijia-89/northwind-qa)**: a 51-test Playwright suite that uses playwrighter's patterns end-to-end against a React 19 SUT and ships seven real bug reports with regression-test guards. The worked example, not just a reference.
- **[`weijia-89/vibe-check`](https://github.com/weijia-89/vibe-check)**: a reviewer evidence surfacer for PRs that may contain LLM-generated code. Pair it with playwrighter on QA work, where patterns shape the test and the scanner flags AI-tells in the diff.

Three more in the same ethos:

- **[`weijia-89/oncology-rag-lab`](https://github.com/weijia-89/oncology-rag-lab)**: offline RAG evaluation lab with DeepEval, Phoenix tracing, drift detection, and a regression-gated CI. Same "the wrap matters more than the pipeline" stance applied to LLM evaluation instead of E2E testing.
- **[`weijia-89/palamedes`](https://github.com/weijia-89/palamedes)**: rigorous-research skill plus a multi-agent synthesis prompt. Companion artifact when the eval target is research output rather than test code.
- **[`weijia-89/wcag-auditor`](https://github.com/weijia-89/wcag-auditor)**: accessibility audit tool that replaced its LLM-based fix engine with deterministic per-rule templates in v0.3, because the templates were already accurate enough.

---

**Version**: 3.0.0
**Updated**: 2026-05-14
**Maintained**: Patterns are stable; updated when official Playwright guidance changes.
