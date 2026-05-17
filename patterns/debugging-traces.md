# Debugging & Trace Viewer

**Source**: [Playwright Trace Viewer Docs](https://playwright.dev/docs/trace-viewer)

---

## When to Use What

| Tool | Use case |
|------|----------|
| **UI Mode** (`--ui`) | Active development, watch mode |
| **Trace Viewer** | CI failures, post-mortem |
| **VS Code extension** | Debug + run tests inline |
| **Inspector** (`--debug`) | Step through test interactively |
| **Codegen** (`codegen <url>`) | Generate locators / scaffold tests |

---

## UI Mode (Best DX)

```bash
npx playwright test --ui
```

- Time-travel through test steps
- Edit + re-run instantly
- Watch mode (re-runs on save)
- Inline error messages
- DOM snapshots per action

**Use this 90% of the time when developing locally.**

---

## Trace Recording Configuration

In `playwright.config.ts`:

```typescript
use: {
  trace: 'on-first-retry', // recommended
}
```

| Option | Behavior | When to use |
|--------|----------|-------------|
| `'on'` | Record every test | Local debugging only, heavy |
| `'on-first-retry'` | Only when retrying | **CI default** |
| `'on-all-retries'` | All retries | Investigating flakes |
| `'retain-on-failure'` | Keep failures only | When retries are off |
| `'retain-on-failure-and-retries'` | Both | Forensic mode |
| `'off'` | Never | Production smoke |

---

## Opening a Trace

### From terminal
```bash
npx playwright show-trace path/to/trace.zip
```

### From the HTML report
```bash
npx playwright show-report
```
Click the trace icon next to a failed test.

### Drag-and-drop
Open https://trace.playwright.dev and drop the `trace.zip` file.

---

## What's in a Trace

| Tab | Contents |
|-----|----------|
| **Actions** | Every Playwright call with timing |
| **Screenshots** | Before/after each action |
| **Snapshots** | Live DOM at each step (clickable!) |
| **Source** | Test code with current line highlighted |
| **Console** | Browser console output |
| **Network** | Request/response for each call |
| **Errors** | Stack traces |
| **Metadata** | Browser, OS, viewport, etc. |

---

## CI Workflow

```yaml
# .github/workflows/playwright.yml
- name: Run tests
  run: npx playwright test

- name: Upload traces on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-traces
    path: test-results/**/trace.zip
    retention-days: 14
```

---

## Inspector Mode (Step-by-Step)

```bash
PWDEBUG=1 npx playwright test login.spec.ts
# or
npx playwright test --debug
```

- Pauses before each action
- Lets you step through manually
- Shows pickable locators in the browser

---

## `test.step()` for Better Traces

Group related actions for trace readability:

```typescript
test('checkout', async ({ page }) => {
  await test.step('Add items', async () => {
    await cartPage.addItem('Widget');
  });

  await test.step('Pay', async () => {
    await checkoutPage.submitPayment();
  });
});
```

Steps appear as collapsible sections in the trace.

---

## Common Debug Scenarios

### "Element not found"
1. Open trace
2. Look at the DOM snapshot at the failing action
3. Confirm the element is actually there
4. If it is, your locator is wrong (use Pick Locator in Inspector)
5. If it isn't, element didn't render in time (use web-first assertion)

### "Test passes locally, fails on CI"
1. Trace will show OS / viewport differences
2. Check timing: does CI run slower? Increase `actionTimeout`?
3. Check `process.env.CI` branches in your code
4. Reproduce locally: `CI=1 npx playwright test`

### "Test is flaky"
1. Set `retries: 1` and `trace: 'on-first-retry'`
2. Run multiple times: `npx playwright test --repeat-each=10`
3. Compare passing vs failing traces
4. Look for: timing jitter, animation, race conditions, cross-test pollution

---

## Best Practices

1. **`trace: 'on-first-retry'` in CI**, cheap insurance
2. **Upload traces as artifacts**, debug failures days later
3. **Use UI mode locally**, best DX
4. **Use `test.step()`**, improves trace readability dramatically
5. **Don't `console.log` debug**, use the trace
6. **Retain artifacts 14+ days**, flake forensics

---

## Anti-Patterns

```typescript
// ❌ BAD: console.log debugging
console.log('user:', await page.getByLabel('Email').inputValue());

// ✅ GOOD: trace shows everything automatically
await page.getByLabel('Email').fill('user@example.com');
// Open the trace, click the action, see full state
```

```yaml
# ❌ BAD: trace 'on' for all tests in CI
trace: 'on'

# ✅ GOOD
trace: 'on-first-retry'
```
