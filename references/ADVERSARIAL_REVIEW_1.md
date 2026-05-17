# Adversarial Review #1: Playwrighter (Pre-Fix)

**Reviewer stance:** Hostile. Looking for every gap, lie, oversimplification, and missing piece.

**Method:** Compared current state against research index (RESEARCH_INDEX.md).

---

## CRITICAL FAILURES

### 1. Vaporware Documentation
README/INDEX promise files that **don't exist**:

| Promised | Reality |
|----------|---------|
| `templates/test-template.ts` | Empty dir |
| `templates/playwright.config.ts` | Empty dir |
| `templates/test-plan-template.md` | Empty dir |
| `tools/validate-suite.sh` | Empty dir |
| `tools/score-tests.js` | Empty dir |
| `references/quality-scorecard.md` | Empty dir |
| `patterns/test-structure.md` | Missing |
| `patterns/anti-patterns.md` | Missing |

The SKILL.md instructs agents to read these. **Agents will fail.**

### 2. Missing Critical Patterns

Compared to canonical Playwright best practices, these are MISSING:

| Topic | Severity | Why critical |
|-------|----------|--------------|
| **Fixtures** | 🔴 CRITICAL | The defining feature of Playwright Test |
| **Page Object Model** | 🔴 CRITICAL | Mentioned in README, no actual file |
| **API Mocking (`page.route()`)** | 🔴 CRITICAL | Avoiding 3rd-party deps is official advice |
| **Trace viewer / debugging** | 🟠 HIGH | How you debug failures |
| **Visual regression (`toHaveScreenshot`)** | 🟠 HIGH | Standard PW feature |
| **Accessibility (`@axe-core/playwright`)** | 🟠 HIGH | Modern standard |
| **CI sharding + blob reports** | 🟠 HIGH | Production deployments need this |
| **Configuration template** | 🔴 CRITICAL | No reference config |
| **Web-first assertion vs `isVisible()`** | 🟡 MEDIUM | Subtle, easy to miss |
| **`test.step()` for tracing** | 🟡 MEDIUM | Improves debuggability |
| **API testing via `request` fixture** | 🟡 MEDIUM | Faster auth, backend tests |
| **Component testing** | 🟢 LOW | Niche but documented |
| **`expect.toPass()` for retry blocks** | 🟡 MEDIUM | Replaces custom retry loops |

### 3. Inaccurate or Outdated Guidance

#### a) Auth path is non-canonical
```
patterns/authentication.md uses `.auth/`
```
Official Playwright recommends `playwright/.auth/`. This matters because all official docs use that path.

#### b) "Verify reproduction in Playwright Inspector first"
```@playwrighter/patterns/locator-strategy.md:158-159
3. Prefer role-based selectors that match real accessibility tree
4. Test the locator in Playwright Inspector first
```
**Codegen** is the canonical tool, not Inspector. Inspector is for debugging existing tests.

#### c) `waitFor()` shown without context
```@playwrighter/patterns/waiting-timing.md:35-36
await page.getByText('Success').waitFor({ state: 'visible' });
```
Not wrong, but `await expect(locator).toBeVisible()` is preferred per official docs (better error messages, web-first retry).

#### d) "One assertion per test" contradicts soft assertions
The patterns show soft assertions but then say "one logical assertion per test." This is internally inconsistent. Modern guidance: **multiple assertions are fine; use soft when failure shouldn't block remaining checks**.

### 4. Unverified Evidence Claims

```
"5,263 tests with networkidle → 100% timeout"
"Same tests with domcontentloaded → 98.4% pass"
"100+ production test files in a large SPA use getByRole()"
```

**Problems:**
- 100% timeout is implausible (no test ever passes intermittently?)
- "Same tests", were they actually identical, or were other things changed?
- These numbers can't be independently verified by an agent
- The guidance is correct, but the supporting evidence is suspect

**Better approach:** Cite official docs (which back the same claims) instead of dubious internal numbers.

### 5. Hardcoded Absolute Paths

```@playwrighter/INDEX.md:147-148
ln -s <project>/playwrighter/.claude/skills/playwrighter \
      your-project/.claude/skills/playwrighter
```

Personal Mac paths throughout. Non-portable. If anyone clones this, it breaks.

### 6. Missing Workflow Concepts

- **Codegen**, `npx playwright codegen` is the #1 productivity tool, not mentioned
- **UI Mode**, modern way to debug, mentioned only briefly in patterns
- **VS Code extension**, best DX, not mentioned
- **`webServer`**, auto-starting dev server, not mentioned
- **`test.use()`**, overriding fixtures per file, not mentioned
- **`test.describe.configure({ mode: 'parallel' })`**, not mentioned

### 7. Test Structure Pattern File MISSING

INDEX.md references `patterns/test-structure.md` and shows:
```typescript
test('[TC-001] User can login @P0', ...)
```
But no actual file explains:
- When to use `describe()` vs flat tests
- Tag conventions (`@P0`, `@smoke`, `@critical`)
- File naming (`*.spec.ts` vs `*.test.ts`)
- Folder organization (by feature vs by page)
- `test.skip()` / `test.fixme()` / `test.fail()` usage

### 8. Quality Scoring Without Implementation

INDEX shows a 100-point rubric:
```
Completeness 25% | Reliability 25% | Maintainability 20% | Execution 15% | Coverage 15%
```
But:
- `tools/score-tests.js` doesn't exist
- The rubric isn't operationalized
- "80+/100 target" with no way to measure = aspirational fluff

---

## SCORE

| Aspect | Score | Notes |
|--------|-------|-------|
| **Accuracy of existing content** | 7/10 | Mostly correct |
| **Completeness vs PW best practices** | 3/10 | ~50% of canonical practices missing |
| **Usability for AI agents** | 2/10 | Broken file references |
| **Portability** | 3/10 | Hardcoded paths |
| **Innovation adoption** | 2/10 | No fixtures, no POM file, no mocking, no a11y |

**OVERALL: 3.4/10**, Scaffold with good intentions, but production-incomplete.

---

## REQUIRED FIXES

### Tier 1 (must-have)
1. Create `patterns/fixtures.md`
2. Create `patterns/page-object-model.md`
3. Create `patterns/network-mocking.md`
4. Create `patterns/test-structure.md`
5. Create `patterns/anti-patterns.md` (consolidated)
6. Create `templates/playwright.config.ts`
7. Create `templates/test-template.ts`
8. Create `templates/test-plan-template.md`
9. Create `templates/auth.setup.ts` (canonical pattern)
10. Update `patterns/authentication.md` to use `playwright/.auth/`
11. Update `INDEX.md` and `README.md` to reflect actual files

### Tier 2 (should-have)
12. Create `patterns/visual-regression.md`
13. Create `patterns/accessibility.md`
14. Create `patterns/debugging-traces.md`
15. Create `patterns/ci-cd.md` (sharding, GitHub Actions)
16. Create `patterns/api-testing.md` (`request` fixture)
17. Create `tools/validate-suite.sh` (lint script)
18. Create `references/quality-scorecard.md`

### Tier 3 (nice-to-have)
19. Replace dubious internal stats with official doc citations
20. Remove hardcoded local-home paths (e.g. `/Users/<name>/...`)
21. Add `templates/auth-fixture.ts` (worker-scoped)
22. Add component testing primer
