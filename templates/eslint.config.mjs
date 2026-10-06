// ESLint flat config matching the checks in tools/validate-suite.sh.
// Install in the consuming repo: npm i -D eslint eslint-plugin-playwright typescript-eslint
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default [
  playwright.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      'playwright/valid-expect': 'error',          // expect() with no matcher
      'playwright/expect-expect': 'error',         // test with no assertions (covers empty test.fixme bodies)
      'playwright/no-skipped-test': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-force-option': 'warn',
      'playwright/missing-playwright-await': 'error',  // floating Playwright calls
      'playwright/no-conditional-expect': 'error',     // expect inside if/try/catch
      'playwright/no-nth-methods': 'warn',             // .first()/.nth()/.last() hide ambiguous locators
      'playwright/no-magic-timeouts': 'warn',          // bare numeric timeouts
      'playwright/max-nested-describe': ['warn', { max: 2 }],
    },
  },
];
