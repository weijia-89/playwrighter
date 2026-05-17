# Quality Scorecard

**Implementation:** `tools/score-tests.js` (operationalizes this rubric)

**Run:**
```bash
node tools/score-tests.js ./tests
node tools/score-tests.js --threshold=80 --json
```

---

## 100-Point Rubric

| Category | Points | What's measured |
|----------|--------|-----------------|
| **Reliability** | 25 | No flaky patterns (waitForTimeout, networkidle, manual isVisible, .toBeTruthy, .only) |
| **Maintainability** | 20 | Accessible locators (no CSS classes, nth-child, xpath) |
| **Completeness** | 25 | Test IDs, assertions present, descriptive structure |
| **Coverage** | 15 | Tags (@P0, @smoke), maps to requirements |
| **Execution** | 15 | Reasonable file size, single-concern tests |

---

## Reliability (25 points)

| Penalty | Trigger |
|---------|---------|
| -10 | `waitForTimeout()` |
| -10 | `waitForLoadState('networkidle')` |
| -5 | `expect(await x.isVisible())` (manual assertion) |
| -5 | `.toBeTruthy()` / `.toBeFalsy()` |
| -5 | `page.pause()` left in code |
| -3 | `test.only()` left in code |
| -3 | `if (await ...)` conditional (split tests instead) |
| -2 | `{ force: true }` (bypasses actionability) |

---

## Maintainability (20 points)

| Penalty | Trigger |
|---------|---------|
| -2 per match (max -10) | CSS class/id locator (`.btn-primary`, `#submit`) |
| -5 | `nth-child()` / `nth-of-type()` |
| -5 | XPath selector (`xpath=...`) |

---

## Completeness (25 points)

| Penalty | Trigger |
|---------|---------|
| -3 per missing (max -10) | Test missing `[TC-XXX]` ID |
| -15 | No `expect()` assertions in file |
| -5 | Fewer assertions than tests |

---

## Coverage (15 points)

| Penalty | Trigger |
|---------|---------|
| -5 | No priority tag (`@P0`/`@P1`/`@P2`/`@P3`) |
| -5 | No category tag (`@smoke`/`@regression`/`@critical`/`@a11y`) |

---

## Execution (15 points)

| Penalty | Trigger |
|---------|---------|
| -5 | File > 400 lines (consider splitting) |
| -5 | Test > 100 lines (consider `test.step()` or split) |

---

## Thresholds

| Threshold | Use |
|-----------|-----|
| **70+** | Minimum to merge to feature branch |
| **80+** | Minimum to merge to main |
| **90+** | Production-ready |
| **95+** | Exemplary |

---

## What This Rubric Doesn't Measure

The script catches surface-level issues. It can't measure:

- **Test value**, does it catch real bugs?
- **Behavior coverage**, are critical paths tested?
- **Test data quality**, are edge cases covered?
- **Locator stability over time**, would this test break next sprint?
- **Failure debuggability**, when it fails, can someone fix it in 5 min?

**Pair scorecard with code review.** The rubric is necessary, not sufficient.

---

## Example Output

```
Quality Scorecard, ./tests
Threshold: 80/100

✅ 95/100  tests/specs/auth/login.spec.ts
     🟡 1 CSS class/id locator(s); prefer getByRole/getByLabel
✅ 90/100  tests/specs/checkout/payment.spec.ts
❌ 65/100  tests/specs/dashboard.spec.ts
     🔴 waitForTimeout() detected
     🔴 networkidle detected
     🟡 3/5 tests missing [TC-XXX] ID

Average: 83.3/100
Files below threshold: 1/3
```
