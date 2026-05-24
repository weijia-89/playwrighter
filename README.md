# playwrighter

I built playwrighter as a Playwright pattern library plus a working test-quality scorer, so an AI agent or a human writing E2E tests has both the patterns to follow and an automated way to check whether the suite actually follows them. The patterns (23 of them under `patterns/`) come from Playwright's official docs, from mxschmitt/awesome-playwright, and from conventions I verified across community projects. The scorer at `tools/score-tests.js` reads a directory of `.spec.ts` files and grades them against a rubric aligned with the patterns: it penalizes the syntactic flake and locator issues the anti-patterns doc emphasizes (for example `waitForTimeout` and CSS class or id selectors inside `.locator()`). Additional rows in `patterns/anti-patterns.md` are covered by `tools/validate-suite.sh` or by review, not by every line having an automatic score penalty. The repo also ships 8 ready-to-copy templates under `templates/` (config, fixtures, auth setup, POMs, package.json) and that validate-suite linter pass.

The agent skill ships from a single canonical body at `skill/SKILL.md`. Cursor loads `.cursor/rules/playwrighter.mdc` (which points at that file); other agents can symlink or copy `skill/SKILL.md` into their skill directory. For human readers, `INDEX.md` is the entry point. For system layout and Mermaid diagrams, see [`arch.md`](arch.md).

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

A pattern library on its own is documentation, and documentation gets read once and then ignored when the agent or the engineer is moving fast. The discipline I wanted was the suite-quality bar that catches the regression at PR time, so I wrote the scorer to mirror the patterns directly. A `waitForTimeout()` call costs 10 points, the same penalty as `networkidle`; a CSS class or id inside `.locator('.btn-primary')` costs 2 points per match (cap 10); the `expect(await x.isVisible())` shape instead of `await expect(x).toBeVisible()` costs 5. The full penalty tables live in the comment block at the top of `tools/score-tests.js`. The rubric scores out of 100 and the default CI threshold is 80.

The scorer is intentionally regex-and-AST simple. It can't tell whether your test is meaningfully testing the right thing, and it doesn't catch the semantic anti-patterns that show up in code review (assertions that don't really constrain behavior, test names that misrepresent what the body asserts). What it does catch is the syntactic decay that creeps into a suite over time, from the flake-fix that introduced a `waitForTimeout` to the quick-locator shortcut that landed a CSS selector instead of an accessible role. Those are the regressions a code reviewer also misses when the diff is large and the time is short, and the scorer fails CI before the reviewer has to find them.

The 23 pattern files are where the scorer's rules trace back to. The scorer penalizes CSS selectors inside `.locator()` and the flake patterns in `patterns/anti-patterns.md`; `patterns/locator-strategy.md` explains why `getByRole` beats CSS, and `patterns/waiting-timing.md` explains why fixed waits are the wrong abstraction. Fixtures, `test.step()`, and per-test length are guidance in the pattern docs and in `tools/validate-suite.sh`, not automatic score penalties. The library and the scorer share a vocabulary on what they do measure, so a contributor or an AI agent reading the SKILL can write tests that pass the scorer for the syntactic bar it enforces.

---

## Structure

```
playwrighter/
├── skill/SKILL.md                         # Canonical agent skill body
├── .cursor/rules/playwrighter.mdc         # Cursor rule (points at skill/SKILL.md)
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
│   └── score-tests.js                     # Quality scorecard (inline rubric)
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
- **`@playwright/test`** ≥ 1.50 (templates and Test Agents patterns; see `templates/package.json`)
- For accessibility patterns: **`@axe-core/playwright`** ≥ 4.10

See `templates/package.json` for a full dependency manifest.

---

## Sources

All patterns trace to primary sources:
- [Playwright Official Docs](https://playwright.dev)
- [`mxschmitt/awesome-playwright`](https://github.com/mxschmitt/awesome-playwright)

---

## Integration

Canonical skill body: **`skill/SKILL.md`** at the playwrighter repo root. Patterns and tools live alongside it in the same checkout.

### Cursor

**From inside the playwrighter repo** (`pwd` is the clone root):
```bash
mkdir -p ~/.cursor/rules
ln -sf "$(pwd)/.cursor/rules/playwrighter.mdc" ~/.cursor/rules/playwrighter.mdc
```

**From a parent monorepo** (playwrighter is a subfolder):
```bash
mkdir -p <your-project>/.cursor/rules
ln -sf "$(pwd)/playwrighter/.cursor/rules/playwrighter.mdc" \
      <your-project>/.cursor/rules/playwrighter.mdc
```

Triggers via globs (`*.spec.ts`, `playwright.config.ts`, `fixtures.ts`, `pages/**/*.ts`, etc.) or model decision. The rule instructs the agent to read `skill/SKILL.md` first (repo-root paths; vendored installs use a `playwrighter/` prefix).

### Other agents (skills.sh, Windsurf, CLI tools with a skills directory)

**From playwrighter repo root:**
```bash
mkdir -p ~/.your-agent/skills/playwrighter
ln -sf "$(pwd)/skill/SKILL.md" ~/.your-agent/skills/playwrighter/SKILL.md
```

**From parent monorepo:**
```bash
ln -sf "$(pwd)/playwrighter/skill/SKILL.md" ~/.your-agent/skills/playwrighter/SKILL.md
```

Keep the full playwrighter checkout available so `patterns/` and `tools/` resolve.

### Reference patterns in your project's AI rules
```markdown
## QA Automation Patterns
See: <path-to-playwrighter>/patterns/
Canonical skill: <path-to-playwrighter>/skill/SKILL.md
```

### Verify
After symlinking, ask your AI tool: *"Write a Playwright test for the login flow."* It should read `skill/SKILL.md` and the relevant pattern files before producing tests.

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

**Version**: 3.1.0
**Updated**: 2026-05-24
**Maintained**: Patterns are stable; updated when official Playwright guidance changes.
