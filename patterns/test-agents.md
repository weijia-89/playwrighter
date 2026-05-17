# Playwright Test Agents

**Source**: [Playwright Test Agents Docs](https://playwright.dev/docs/test-agents)

**Requires:** `@playwright/test` ≥ 1.50 and an MCP-capable AI client (Claude Desktop/Code, Cursor, Copilot, etc.)

Built-in AI agents that explore your app, generate tests, and self-heal failures.

---

## The Three Agents

| Agent | Input | Output |
|-------|-------|--------|
| **🎭 Planner** | App URL + seed test (+ optional PRD) | Markdown test plan in `specs/` |
| **🎭 Generator** | Markdown plan + seed test | Playwright `.spec.ts` files in `tests/` |
| **🎭 Healer** | Failing test name | Patched test (locator updates, wait fixes) |

These run via your AI assistant (Claude, Copilot, etc.) using Playwright's MCP server. Use them sequentially OR independently.

---

## Repository Convention

```
repo/
├── .github/                     # agent definitions (auto-generated)
├── specs/                       # human-readable test plans
│   ├── basic-operations.md
│   └── checkout-flow.md
├── tests/
│   ├── seed.spec.ts             # MANDATORY: sets up environment for agents
│   ├── fixtures.ts
│   └── basic-operations/
│       ├── add-valid-todo.spec.ts
│       └── delete-todo.spec.ts
└── playwright.config.ts
```

---

## Step 1: Initialize Agents

```bash
npx playwright init-agents --loop=claude   # or --loop=copilot, --loop=cursor
```

This generates agent definitions in `.github/`. Pick the AI loop you use.

---

## Step 2: Write the Seed Test

The seed test is the agent's **environment template**. Every generated test will start where seed leaves off.

```typescript
// tests/seed.spec.ts
import { test, expect } from './fixtures';

test('seed', async ({ page }) => {
  // This test demonstrates the standard test setup.
  // Agents will generate tests that mirror this structure.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
```

The seed test:
- Imports from your custom `./fixtures` (not raw `@playwright/test`)
- Performs any common setup (navigate, login if needed)
- Demonstrates fixture usage agents should follow

---

## Step 3: Run the Planner

### Concrete prompt template
```
@playwright-planner

Generate a test plan for the following user flow:
- Flow name: Guest checkout
- Starting URL: http://localhost:3000
- Seed test: tests/seed.spec.ts
- Scope: Browse products, add to cart, checkout as guest, verify confirmation

Cover:
- Happy path
- 2-3 edge cases (empty cart, invalid card, network failure)
- Accessibility for the form
```

The Planner:
- Runs the seed test to set up environment
- Explores your app interactively (uses Playwright MCP)
- Produces `specs/guest-checkout.md`, a human-readable plan with steps + expected results

Review the plan. Edit, refine, push back to the Planner if needed:
```
The plan misses the case where the cart has 1 item vs 5+ items.
Also add an a11y check after submitting the form.
```

---

## Step 4: Run the Generator

### Concrete prompt
```
@playwright-generator

Generate Playwright tests from specs/guest-checkout.md.
- Use seed test: tests/seed.spec.ts (matches its imports + style)
- Output to: tests/guest-checkout/
- One file per top-level scenario
- Tag each test with @P1 (or @P0 for happy path)
- Use custom fixtures from ./fixtures (not raw @playwright/test)
```

The Generator:
- Reads the spec
- Verifies locators live in the browser
- Produces `.spec.ts` files in `tests/`
- Imports from `./fixtures` consistent with seed

Generated tests look like:
```typescript
// spec: specs/guest-checkout.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Guest Checkout', () => {
  test('Add to cart and checkout', async ({ page }) => {
    // 1. Click on product
    await page.getByRole('link', { name: 'Widget' }).click();

    // 2. Add to cart
    await page.getByRole('button', { name: 'Add to cart' }).click();

    // Expected:
    await expect(page.getByText('Added to cart')).toBeVisible();
    // ...
  });
});
```

---

## Step 5: Run the Healer (when tests fail)

### Concrete prompt
```
@playwright-healer

Fix the failing test:
- File: tests/guest-checkout/add-to-cart.spec.ts
- Test: "Add to cart and checkout"
- Last failure: "TimeoutError: locator.click: Timeout 10000ms exceeded"
- Constraint: do not relax assertions; only update locators or waits
```

The Healer:
- Replays the failing steps
- Inspects current DOM
- Suggests a patch (updated locator, adjusted wait, fixed data)
- Re-runs until pass or guardrails kick in
- May `test.skip()` if it determines functionality is genuinely broken (review skips!)

---

## Best Practices

### DO
- **Maintain a high-quality seed test**, agents copy its style
- **Review every plan before generation**, Planner can hallucinate scenarios
- **Review every Healer patch**, don't merge auto-fixes blindly
- **Use real fixtures (POM injection)**, not raw `page` calls
- **Commit `specs/`**, they're documentation
- **Re-run Planner periodically**, keeps plans aligned with new features

### DON'T
- Use agents on flows that touch production data without a sandbox
- Trust Healer for tests that exercise critical security flows, review manually
- Skip the seed test or make it minimal, that's where agents learn your conventions
- Run Healer without `retries: 2+`, partial success can mask flakes

---

## When Agents Help vs. When They Don't

| Use agents | Manual is better |
|-----------|-------------------|
| Discovery testing for a new feature | Hand-crafted critical-path tests |
| Generating coverage for a stable UI | Tests for security/auth edge cases |
| Auto-healing locator drift after refactors | Tests that exercise complex business logic |
| Smoke test scaffolds | Tests with intricate setup/teardown |

---

## Integration with Playwright MCP

Agents use the Playwright MCP server (`@playwright/mcp`) under the hood. If your AI assistant supports MCP (Claude, Cursor, GitHub Copilot, etc.), agents work out of the box.

```bash
# Standalone (no Playwright Test):
npx @playwright/mcp@latest --headless
```

---

## Cautions

1. **Generated tests are not free**, they need review like any AI-generated code
2. **Healer can mask real bugs**, if a "fix" makes a test pass, ask: did the bug get hidden?
3. **Plans are starting points**, Planner doesn't know your business priorities
4. **Don't replace humans**, agents accelerate; they don't substitute for engineering judgment

---

## Anti-Patterns

```
❌ Letting agents commit directly to main
❌ No human review of generated specs/tests
❌ Trusting Healer fixes without reproducing the failure
❌ Using agents on flows you wouldn't trust an intern with
```

---

## Resources

- Official: https://playwright.dev/docs/test-agents
- MCP: https://github.com/microsoft/playwright-mcp
- Currents skill: https://github.com/currents-dev/playwright-best-practices-skill (alternative AI skill)
