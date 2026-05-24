# Templates

Copy these into a fresh test project. Order matters.

---

## Consumer bootstrap

Greenfield repos can vendor playwrighter and pass the quality gates without reading all 23 pattern files first. Copy in this order, then run the npm scripts wired in `templates/package.json`.

### 1. Keep a playwrighter checkout (patterns + skill)

Clone or submodule the [playwrighter](https://github.com/weijia-89/playwrighter) repo somewhere on disk. You need it for:

- **`skill/SKILL.md`** — agent mandatory workflow (read patterns → use templates → validate before done)
- **`patterns/`** — consulted per task, not copied wholesale
- **`tools/`** — copied into your project in step 3

Wire your AI agent to the skill (symlink or copy `skill/SKILL.md`; see root `README.md` § Integration). Agents should follow the [Mandatory Workflow](../skill/SKILL.md#mandatory-workflow): read relevant `patterns/` files, start from these templates, then run validate + score.

### 2. Copy templates into your project root

From your playwrighter checkout:

```bash
PLAYWRIGHTER=/path/to/playwrighter
PROJECT=your-project

mkdir -p "$PROJECT/tests/specs" "$PROJECT/tests/pages"
cp "$PLAYWRIGHTER/templates/package.json" "$PROJECT/"
cp -r "$PLAYWRIGHTER/templates/scripts" "$PROJECT/"
cp "$PLAYWRIGHTER/templates/playwright.config.ts" "$PROJECT/"
cp -r "$PLAYWRIGHTER/templates/pages/"* "$PROJECT/tests/pages/"
cp "$PLAYWRIGHTER/templates/fixtures.ts" "$PROJECT/tests/"
cp "$PLAYWRIGHTER/templates/auth.setup.ts" "$PROJECT/tests/"
cp "$PLAYWRIGHTER/templates/test-template.ts" "$PROJECT/tests/specs/example.spec.ts"
```

Adjust paths if your suite lives under a different folder; update `playwright.config.ts` `testDir` and the `./tests` paths in `package.json` scripts to match.

### 3. Copy `tools/` (validate + score)

```bash
cp -r "$PLAYWRIGHTER/tools" "$PROJECT/tools"
chmod +x "$PROJECT/tools/validate-suite.sh"
```

`scripts/check-tools.js` (from step 2) fails fast with copy instructions if `tools/` is missing.

### 4. Install, configure env, gate before merge

```bash
cd "$PROJECT"
npm install
npx playwright install chromium --with-deps

cat > .env << 'EOF'
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=TestPass123!
EOF
echo -e ".env\nplaywright/.auth/" >> .gitignore

npm run validate   # check-tools → validate-suite → lint → typecheck
npm run score      # check-tools → score-tests (threshold 80)
```

Both scripts resolve `./tools/` relative to your project root — do not edit those paths unless you relocate `tools/`.

**CI:** run `npm run validate` then `npm run score` on every PR (same order as [dogfood workflow](../.github/workflows/dogfood-northwind-qa.yml) against northwind-qa).

---

## Order of Operations

See [Consumer bootstrap](#consumer-bootstrap) for the full copy-paste flow. Summary:

1. **`package.json`**, install dependencies first
2. **Copy `tools/`** from the playwrighter repo into your project root (`validate-suite.sh`, `score-tests.js`)
3. **`playwright.config.ts`**, Playwright config (references `playwright/.auth/`)
4. **`pages/login-page.ts`** + **`pages/dashboard-page.ts`**, POMs
5. **`fixtures.ts`**, custom test fixtures (imports POMs from step 4)
6. **`auth.setup.ts`**, auth setup project (referenced in config)
7. **`test-template.ts`**, template for new test specs
8. **`test-plan-template.md`**, for planning new test suites

---

## Quick Setup

```bash
# 1. Copy templates + quality tools to your project
cp templates/package.json your-project/package.json
cp -r templates/scripts your-project/scripts
cp templates/playwright.config.ts your-project/
cp -r templates/pages your-project/tests/
cp templates/fixtures.ts your-project/tests/
cp templates/auth.setup.ts your-project/tests/
cp -r /path/to/playwrighter/tools your-project/tools
chmod +x your-project/tools/validate-suite.sh

# 2. Install
cd your-project
npm install

# 3. Install browsers
npx playwright install chromium --with-deps

# 4. Configure env
cat > .env << 'EOF'
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=TestPass123!
EOF
echo ".env" >> .gitignore
echo "playwright/.auth/" >> .gitignore

# 5. Write your first test
cp templates/test-template.ts your-project/tests/specs/auth.spec.ts

# 6. Run
npm test
```

---

## Optional Dependencies

Add these as needed for specific patterns:

| Package | When | Pattern file |
|---------|------|--------------|
| `@axe-core/playwright` | Accessibility scans | `patterns/accessibility.md` |
| `@guidepup/playwright` | Screen reader testing | `patterns/accessibility.md` |
| `allure-playwright` | Rich Allure reports | `patterns/reporters.md` |
| `monocart-reporter` | Alternative HTML reporter | `patterns/reporters.md` |
| `otpauth` | TOTP / MFA testing | `patterns/oauth-mfa-sso.md` |
| `oauth2-mock-server` | OAuth integration tests | `patterns/oauth-mfa-sso.md` |
| `playwright-lighthouse` | Performance / Web Vitals | `patterns/performance.md` |
| `playwright-slack-report` | Slack notifications | `patterns/reporters.md` |
| `@playwright/experimental-ct-react` | Component testing (React) | `patterns/component-testing.md` |
| `@playwright/experimental-ct-vue` | Component testing (Vue) | `patterns/component-testing.md` |
| `@playwright/mcp` | AI agent integration | `patterns/test-agents.md` |

Install:
```bash
npm i -D @axe-core/playwright otpauth playwright-lighthouse  # etc.
```

---

## Customization

### Change BASE_URL
Edit `playwright.config.ts`:
```typescript
use: {
  baseURL: process.env.BASE_URL || 'https://your-app.com',
}
```

### Add more browsers
Edit `playwright.config.ts` `projects` array. Already includes Chromium, Firefox, WebKit.

### Add mobile projects
```typescript
projects: [
  { name: 'mobile-chrome', use: { ...devices['Pixel 7'], storageState: 'playwright/.auth/user.json' }, dependencies: ['setup'] },
  { name: 'mobile-safari', use: { ...devices['iPhone 15'], storageState: 'playwright/.auth/user.json' }, dependencies: ['setup'] },
]
```

### Use a different auth strategy
- **Single user** (default), current `auth.setup.ts` works
- **Per-worker**, see `patterns/authentication.md` Tier 2
- **Multiple roles**, add more setup blocks in `auth.setup.ts`
- **API auth**, see `patterns/oauth-mfa-sso.md`

---

## File Relationships

```
playwright.config.ts ──→ references auth.setup.ts via setup project
                    ──→ references playwright/.auth/user.json via storageState

auth.setup.ts ──────────→ writes playwright/.auth/user.json

fixtures.ts ────────────→ imports pages/*.ts
                    ──→ exports `test`, `expect` for use in spec files

test-template.ts ───────→ imports `test`, `expect` from fixtures.ts
                    ──→ uses POMs via fixture injection
```
