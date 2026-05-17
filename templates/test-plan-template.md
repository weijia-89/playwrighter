# Test Plan: [Feature Name]

**Status:** Draft / In Review / Approved
**Author:** [Name]
**Date:** [YYYY-MM-DD]
**Related:** [Jira/Linear ticket, PRD link]

---

## 1. Scope

### In scope
- [Feature, page, or workflow being tested]
- [Critical user paths]

### Out of scope
- [Excluded areas, be explicit]
- [Features tested elsewhere]

---

## 2. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [e.g., Payment flow breaks] | High | High | E2E + visual + a11y |
| [e.g., Mobile layout regression] | Medium | Medium | Mobile viewport tests |

---

## 3. Test Matrix

### User journeys
| ID | Journey | Priority | Type |
|----|---------|----------|------|
| TC-001 | Happy-path login → dashboard | P0 | E2E smoke |
| TC-002 | Login with wrong password | P1 | E2E regression |
| TC-003 | Add item, apply discount, checkout | P0 | E2E smoke |

### Edge cases
| ID | Scenario | Priority |
|----|----------|----------|
| TC-101 | Empty cart redirects to products | P2 |
| TC-102 | Out-of-stock item shows error | P2 |
| TC-103 | Network failure during payment | P1 |

### Cross-cutting
| ID | Scenario | Priority |
|----|----------|----------|
| TC-201 | Accessibility scan (WCAG 2.1 AA) | P1 |
| TC-202 | Visual regression on key pages | P2 |
| TC-203 | Mobile viewport (375x667) | P2 |

---

## 4. Test Data

| Item | Source |
|------|--------|
| Test users | `playwright/.auth/` (seeded) |
| Mock products | `tests/mocks/products.json` |
| Test credit card | Stripe test card 4242... |

---

## 5. Environment

| Env | URL | Notes |
|-----|-----|-------|
| Local | http://localhost:3000 | Default |
| Staging | https://staging.example.com | CI runs here |
| Prod | https://example.com | Smoke only |

---

## 6. Tooling

- **Framework:** Playwright Test
- **Browsers:** Chromium, Firefox, WebKit (configure per project)
- **CI:** GitHub Actions with sharding (4 shards)
- **Reporter:** blob → merged HTML
- **A11y:** `@axe-core/playwright`

---

## 7. Acceptance Criteria

Tests are "done" when:

- [ ] All P0/P1 cases automated
- [ ] All tests pass 3+ consecutive runs locally
- [ ] All tests pass on CI
- [ ] No `waitForTimeout()` or `networkidle`
- [ ] Accessible locators throughout
- [ ] Specific assertions only (no `.toBeTruthy()`)
- [ ] Quality scorecard ≥ 80/100 per test
- [ ] README documents setup, env vars, CI config

---

## 8. Open Questions

| # | Question | Owner |
|---|----------|-------|
| 1 | [e.g., Should we mock payments or hit Stripe test mode?] | Eng |

---

## 9. Out-of-Band Signals

What external checks (besides this suite) verify quality?

- Unit tests
- Integration tests
- Manual exploratory testing
- VOC monitoring
