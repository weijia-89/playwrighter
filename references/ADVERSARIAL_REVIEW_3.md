# Adversarial Review #3, Post-Round-1 Build, Pre-Round-2

**Reviewer stance:** Same project, after Round 2 research uncovered major missing topics. Brutally hostile.

---

## CATASTROPHIC GAPS (just discovered)

### 1. ZERO coverage of Playwright Test Agents 🔥
Playwright shipped built-in AI agents (planner / generator / healer) in 2026 and the project doesn't mention them ANYWHERE. This is THE marquee feature for AI-assisted test generation, and the project's stated purpose is "AI agent skill for Playwright test generation."

Severity: **CRITICAL**, directly contradicts the project's mission.

### 2. ZERO coverage of Component Testing
`@playwright/experimental-ct-react` (and Vue/Svelte) is a real, official Playwright product. Not mentioned. For component-heavy codebases, this is the right level of test (not E2E).

Severity: **CRITICAL** for any modern frontend project.

### 3. ZERO coverage of iframes / FrameLocator
Stripe checkout, embedded videos, third-party widgets, OAuth provider redirects, all use iframes. Common scenario, completely missing.

Severity: **HIGH**, anyone testing payment or auth flows hits this.

### 4. Mobile/emulation barely covered
The `playwright.config.ts` template has commented-out mobile config (now removed in fixes), but no `patterns/mobile-responsive.md`. The `devices` registry, viewport overrides, geolocation, locale, color-scheme, permissions, all missing.

Severity: **HIGH**, responsive testing is table stakes.

### 5. OAuth/SSO/MFA shallow
The auth pattern file mentions "API-based auth" as Tier 4 but doesn't show:
- OAuth state-param echoing in mocks
- TOTP generation with timing window check
- Magic link API bypass
- Multi-tenant isolation
- `oauth2-mock-server` for full OAuth simulation
- When to mock OAuth vs run real integration tests

Severity: **HIGH**, modern apps almost all use OAuth/SSO.

### 6. No test data factories
Generic mention of "test data" in test-plan template, but no `patterns/test-data.md` showing Faker, factory functions, per-worker uniqueness. This is *the* most common ask in real projects.

Severity: **HIGH**.

### 7. No performance testing
`playwright-lighthouse` is a one-line install, gives Web Vitals + a11y + perf scores. Not mentioned. The `references/RESEARCH_INDEX.md` lists `playwright-lighthouse` but no actual pattern file exists.

Severity: **MEDIUM-HIGH**.

### 8. No `eslint-plugin-playwright` guidance
This is THE standard linter. It catches `waitForTimeout`, `networkidle`, missing `expect`, conditional logic in tests, automatically. The project has its own `validate-suite.sh` (good!) but doesn't mention the standard linter that does the same job better.

Severity: **MEDIUM**, duplicating effort.

### 9. Reporter ecosystem missing
Only `html`, `blob`, `github` mentioned. No mention of `allure-playwright`, `monocart-reporter`, `playwright-slack-report`, CTRF, etc. For real teams, Allure is non-negotiable.

Severity: **MEDIUM**.

### 10. No screen reader testing
`@guidepup/Playwright` is the only programmatic way to test VoiceOver/NVDA. For serious a11y work, this is essential, and the a11y pattern claims completeness.

Severity: **MEDIUM**.

---

## SHALLOW COVERAGE

### 11. Auth anti-patterns thin
Currents.dev's auth guide lists 7 anti-patterns. Round 1 covered ~2 of them. Missing:
- Single shared test user
- Globally shared auth tokens
- Mocking OAuth without real integration
- Testing only happy path
- Timing-dependent auth checks
- Leftover sessions between runs

### 12. `expect.poll` not covered
Modern alternative to `expect.toPass()` for polling specific values. Different use case (poll a value vs retry a block). Missing.

### 13. `testInfo` API unmentioned
- `testInfo.parallelIndex`, needed for per-worker fixtures
- `testInfo.attach()`, attach artifacts to reports
- `testInfo.annotations`, link tests to tickets
- `testInfo.project.outputDir`, auto-cleaned dir for artifacts

The auth pattern uses `test.info()` but doesn't explain it.

### 14. No mention of `page.emulateMedia`
Color scheme, print preview, reduced motion, all configurable via `page.emulateMedia`. Critical for theme/print testing.

### 15. No `request.url()` filtering example in mocks
Round 2 fix added this, but only one tiny snippet. More elaboration would help.

### 16. Trace `attachments` and `annotations`
Not covered. Allows attaching screenshots, JSON, logs to test reports for forensics.

### 17. No Playwright CRX mention
Codegen-as-Chrome-extension. Mentioned in awesome-playwright. Useful when codegen CLI doesn't fit (production debugging).

### 18. POMWright / playwright-elements / Serenity
Alternative POM frameworks not mentioned even as "if you outgrow vanilla POM, consider..."

---

## INTERNAL INCONSISTENCIES

### 19. README and INDEX claim "production-ready" but no agents
The README says "production-ready Playwright best practices reference." Without test agents, component testing, mobile, performance, eslint integration, it's a strong starter, not production-ready.

### 20. SKILL.md doesn't reference test agents
The skill targets "AI agents writing Playwright tests" but doesn't mention Playwright's OWN agent system.

### 21. `validate-suite.sh` overlaps with eslint-plugin-playwright
Both check the same anti-patterns. Should at least mention the eslint plugin as the more rigorous option.

### 22. Test plan template doesn't mention agents workflow
With Test Agents, the workflow is: Planner → Generator → Healer. Test plan templates should reference this option.

---

## CONTRADICTIONS WITH OFFICIAL DOCS

### 23. Auth fixture writes to `__dirname/../playwright/.auth/`
Official 2026 docs (and Currents) recommend `testProject.outputDir` for auth state, Playwright auto-cleans it. The current pattern uses a manually managed directory.

### 24. Tracing recommendation is incomplete
Skill says `trace: 'on-first-retry'`. Modern docs also recommend `'retain-on-failure-and-retries'` for "flake forensics" mode. Not mentioned.

---

## EVIDENCE OF NEGLIGENCE

A user runs:
```bash
npx playwright test --update-agents  # generates agent definitions
```
This works **today** in Playwright. The project has no idea it exists.

A user asks Claude / Cursor: "Generate Playwright tests with Test Agents."
The skill provides no guidance on the agent workflow.

A user adopts the project, follows all patterns, then wonders why their UI library tests use full E2E setup. They needed component testing.

---

## SCORE

| Aspect | Round 1 Final | After Round 2 Discovery |
|--------|---------------|-------------------------|
| Accuracy | 9 | 9 (still accurate) |
| Completeness vs PW best practices | 9 | **5** (Round 2 found massive gaps) |
| Usability for AI agents | 9 | 6 (no Test Agents = mission failure) |
| Modernness | 8 | 4 (2026 features missing) |
| Innovation adoption | 9 | 5 (huge ecosystem unmentioned) |

**Recalibrated score: 5.5/10** after Round 2 reveals Round 1 was incomplete by 30-40%.

---

## REQUIRED FIXES (Round 2)

### Tier 1 (must-have for "production-ready" claim)
1. `patterns/test-agents.md`, Planner/Generator/Healer workflow
2. `patterns/component-testing.md`, `@playwright/experimental-ct-*`
3. `patterns/iframes-and-frames.md`, FrameLocator + nested
4. `patterns/mobile-responsive.md`, devices, viewport, geolocation, etc.
5. `patterns/test-data.md`, Faker, factories, per-worker uniqueness
6. Expand `patterns/authentication.md` with OAuth/MFA/SSO sections
7. `patterns/reporters.md`, Allure, monocart, slack, CTRF
8. `patterns/eslint-plugin.md`, eslint-plugin-playwright config
9. `patterns/performance.md`, playwright-lighthouse + web vitals

### Tier 2 (should-have)
10. Update `patterns/accessibility.md` with `@guidepup/Playwright`
11. Update SKILL.md to recommend Test Agents workflow
12. Update auth pattern to write to `testProject.outputDir`
13. Add `expect.poll` to assertions pattern
14. Document `testInfo` API in test-structure
15. Add `page.emulateMedia` example

### Tier 3 (nice-to-have)
16. Mention POMWright / Serenity-JS / playwright-elements as alternatives
17. Mention Playwright CRX
18. Mention `@global-cache/Playwright`
19. Mention `playwright-network-cache`
20. Mention `playwright-cleanup`
