# ESLint & Linting Playwright Tests

**Source**: [eslint-plugin-playwright](https://github.com/playwright-community/eslint-plugin-playwright)

The official ESLint plugin enforces Playwright best practices automatically. Every project should use it.

---

## Install

```bash
npm i -D eslint @eslint/js typescript-eslint eslint-plugin-playwright
```

---

## Modern Flat Config (recommended)

```javascript
// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.{js,ts}', '**/*.spec.{js,ts}'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,

      // Stricter than recommended:
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/expect-expect': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/no-focused-test': 'error',
      'playwright/no-force-option': 'warn',
      'playwright/no-page-pause': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/missing-playwright-await': 'error',
    },
  },
];
```

---

## Legacy `.eslintrc` Config

```json
{
  "extends": ["eslint:recommended", "plugin:playwright/recommended"],
  "overrides": [
    {
      "files": ["tests/**/*.spec.ts"],
      "rules": {
        "playwright/no-conditional-in-test": "error",
        "playwright/no-wait-for-timeout": "error",
        "playwright/no-networkidle": "error",
        "playwright/expect-expect": "error",
        "playwright/no-focused-test": "error",
        "playwright/prefer-web-first-assertions": "error"
      }
    }
  ]
}
```

---

## What Each Rule Catches

| Rule | Catches |
|------|---------|
| `no-wait-for-timeout` | `await page.waitForTimeout(5000)` |
| `no-networkidle` | `waitForLoadState('networkidle')` |
| `expect-expect` | Tests with no assertions |
| `no-focused-test` | `test.only()` left in code |
| `no-skipped-test` | `test.skip()` (warn only) |
| `no-conditional-in-test` | `if/else` branching in tests |
| `prefer-web-first-assertions` | `expect(await x.isVisible()).toBe(true)` |
| `missing-playwright-await` | Missing `await` on Playwright calls |
| `no-page-pause` | `page.pause()` left in code |
| `no-force-option` | `{ force: true }` (escape hatch) |
| `valid-expect` | Misshapen assertions |
| `no-element-handle` | `page.$()` (deprecated API) |
| `no-eval` | `page.evaluate(string)` |
| `no-nested-step` | Nested `test.step` |

Full rule list: https://github.com/playwright-community/eslint-plugin-playwright#list-of-rules

---

## Add to package.json

```json
{
  "scripts": {
    "lint": "eslint tests/",
    "lint:fix": "eslint tests/ --fix",
    "test": "playwright test"
  }
}
```

---

## CI Integration

```yaml
# .github/workflows/lint.yml
- name: Lint Playwright tests
  run: npm run lint
```

Run lint BEFORE tests, saves CI minutes when something obvious is broken.

---

## TypeScript Type Checking

ESLint catches anti-patterns; `tsc --noEmit` catches type errors:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint tests/",
    "validate": "npm run typecheck && npm run lint && npx playwright test"
  }
}
```

---

## ESLint vs `validate-suite.sh`

| | `eslint-plugin-playwright` | `tools/validate-suite.sh` |
|--|---------------------------|---------------------------|
| **Coverage** | 30+ rules | ~10 patterns |
| **AST-aware** | Yes (true semantic check) | No (regex) |
| **IDE integration** | Yes (real-time) | No (CLI only) |
| **Auto-fix** | Some rules | No |
| **Speed** | Fast | Fastest |
| **Configurability** | Per-rule severity | All-or-nothing |

**Use both:** ESLint for accuracy, `validate-suite.sh` for cheap pre-commit gate.

---

## Common Errors and Fixes

### `playwright/no-wait-for-timeout`
```typescript
// ❌
await page.waitForTimeout(5000);

// ✅
await expect(page.getByText('Done')).toBeVisible();
```

### `playwright/expect-expect`
```typescript
// ❌
test('login', async ({ page }) => {
  await page.getByRole('button').click();
  // No expect
});

// ✅
test('login', async ({ page }) => {
  await page.getByRole('button').click();
  await expect(page).toHaveURL(/dashboard/);
});
```

### `playwright/prefer-web-first-assertions`
```typescript
// ❌
expect(await page.getByText('x').isVisible()).toBe(true);

// ✅
await expect(page.getByText('x')).toBeVisible();
```

### `playwright/missing-playwright-await`
```typescript
// ❌
expect(page.getByText('x')).toBeVisible();

// ✅
await expect(page.getByText('x')).toBeVisible();
```

### `playwright/no-conditional-in-test`
```typescript
// ❌
test('flexible', async ({ page, isMobile }) => {
  if (isMobile) {
    await page.getByLabel('Menu').click();
  } else {
    await page.getByRole('navigation').click();
  }
});

// ✅ Split into separate tests
test('mobile menu @mobile', async ({ page }) => { /* */ });
test('desktop nav @desktop', async ({ page }) => { /* */ });
```

---

## VS Code Setup

`.vscode/settings.json`:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "typescript"]
}
```

Now save = auto-fix lint issues.

---

## Best Practices

1. **Always use `eslint-plugin-playwright`**, non-negotiable for serious projects
2. **Strict mode in CI**, fail builds on lint errors
3. **Auto-fix on save in IDE**, catch issues at write-time
4. **Pair with TypeScript strict**, type errors + lint errors caught
5. **Run lint BEFORE tests in CI**, save minutes on obvious breaks

---

## Resources

- https://github.com/playwright-community/eslint-plugin-playwright
- Rule list: https://github.com/playwright-community/eslint-plugin-playwright#list-of-rules
