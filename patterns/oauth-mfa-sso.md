# OAuth, SSO & MFA Authentication

**Sources**: [Playwright Auth Docs](https://playwright.dev/docs/auth), [Currents.dev complete auth guide](https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide)

Modern apps use OAuth providers (Google, GitHub, Microsoft, Okta), SSO (SAML), and MFA (TOTP, SMS, magic links). This pattern shows how to test each reliably.

---

## Strategy: Mock for Feature Tests, Real for Integration

| Test type | Approach | Frequency |
|-----------|----------|-----------|
| **Feature tests** (login → dashboard works) | Mock OAuth | Every PR |
| **Integration tests** (OAuth handshake works) | Real OAuth provider sandbox | Nightly |
| **Production smoke** (real users can log in) | Real provider, real account | Post-deploy |

Most tests should mock. Real-OAuth tests are slow + flaky and shouldn't gate PRs.

---

## OAuth: Mock the Redirect

```typescript
test('Google login → dashboard', async ({ page }) => {
  // Intercept the redirect TO the OAuth provider, redirect BACK to callback
  await page.route('https://accounts.google.com/**', async (route) => {
    const url = new URL(route.request().url());
    const state = url.searchParams.get('state');         // CSRF token
    const redirectUri = url.searchParams.get('redirect_uri');

    await route.fulfill({
      status: 302,
      headers: {
        Location: `${redirectUri}?code=mock-auth-code&state=${state}`,
      },
    });
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/.*dashboard/);
});
```

**Critical:** the mock MUST echo back the `state` parameter, or your app's CSRF check rejects the callback.

**Backend setup:** your token-exchange endpoint must accept `mock-auth-code` and issue a session. Two options:
1. Test-mode bypass in your backend
2. Run `oauth2-mock-server` locally during tests

---

## OAuth: Use `oauth2-mock-server`

For full OAuth simulation without backend modifications:

```bash
npm i -D oauth2-mock-server
```

```typescript
// tests/oauth-mock.setup.ts
import { OAuth2Server } from 'oauth2-mock-server';

let server: OAuth2Server;

export async function startMockOAuth() {
  server = new OAuth2Server();
  await server.issuer.keys.generate('RS256');
  await server.start(8080, 'localhost');
  return `http://localhost:8080`;
}

export async function stopMockOAuth() {
  await server?.stop();
}
```

Configure your app to point at `http://localhost:8080` during tests (env var override).

---

## OAuth Real Integration Tests (Separate Suite)

```typescript
// tests/integration/oauth-real.spec.ts
test.describe.configure({ mode: 'serial' });  // OAuth providers throttle

test('real Google OAuth round trip', async ({ page }) => {
  test.skip(!process.env.RUN_OAUTH_INTEGRATION, 'Nightly only');

  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();

  // Real provider flow
  await page.getByLabel('Email').fill(process.env.OAUTH_TEST_EMAIL!);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Password').fill(process.env.OAUTH_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL(/.*dashboard/);
});
```

**Use a dedicated test tenant** (Google Workspace test org, Azure AD sandbox, Okta preview). Don't share with prod.

---

## TOTP-Based MFA

```bash
npm i -D otpauth
```

```typescript
import * as OTPAuth from 'otpauth';

async function generateTOTP(): Promise<string> {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(process.env.TOTP_SECRET!),
    digits: 6,
    period: 30,
  });

  // Critical: ensure we have enough time before code expires
  const now = Math.floor(Date.now() / 1000);
  const remaining = 30 - (now % 30);
  if (remaining < 5) {
    // Wait for fresh window
    await new Promise(r => setTimeout(r, remaining * 1000));
  }

  return totp.generate();
}

test('login with TOTP MFA', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // MFA prompt
  const code = await generateTOTP();
  await page.getByLabel('Verification code').fill(code);
  await page.getByRole('button', { name: 'Verify' }).click();

  await expect(page).toHaveURL(/.*dashboard/);
});
```

**Why the timing check:** TOTP codes expire every 30s. If you generate one with 2s left, network latency expires it before submission. Always check remaining time and wait if needed.

**Clock drift:** CI runners with bad NTP sync produce wrong codes. Enforce NTP or freeze container time.

---

## Magic Link Authentication

For features tests, **bypass email**. Generate the token directly via API.

```typescript
test('magic link login', async ({ page, request }) => {
  // Step 1: trigger magic link
  await request.post('/api/auth/magic-link', {
    data: { email: 'user@example.com' },
  });

  // Step 2: get the token via test-only endpoint
  const tokenResp = await request.get('/api/test/magic-link-token?email=user@example.com');
  const { token } = await tokenResp.json();

  // Step 3: visit the magic link URL directly
  await page.goto(`/auth/verify?token=${token}`);
  await expect(page).toHaveURL(/.*dashboard/);
});
```

**⚠️ CRITICAL, Backend test endpoint security:**
- Expose `/api/test/...` ONLY when `NODE_ENV=test` (or behind a feature flag)
- Add a kill-switch check in middleware:
  ```ts
  if (!process.env.ALLOW_TEST_ENDPOINTS) return res.status(404).end();
  ```
- Audit before each release that test routes return 404 in prod
- Consider a separate test-only build target that excludes these routes entirely
- Leaking a magic-link generator endpoint in prod is account-takeover-grade severity

For full E2E, **intercept email** with Mailpit, MailHog, or a similar dev SMTP server.

---

## SSO (SAML)

SAML flows are similar to OAuth but with XML-based assertions. Same approach:
- **Feature tests:** mock the IdP redirect
- **Integration tests:** use a sandbox IdP (Okta preview, Azure AD test tenant)

```typescript
test('SAML login', async ({ page }) => {
  await page.route('**/saml/login', async (route) => {
    // Construct a mock SAML response
    const samlResponse = process.env.MOCK_SAML_RESPONSE!;
    await route.fulfill({
      status: 302,
      headers: {
        Location: `/saml/acs?SAMLResponse=${encodeURIComponent(samlResponse)}`,
      },
    });
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with SSO' }).click();
  await expect(page).toHaveURL(/.*dashboard/);
});
```

---

## Multi-Tenant SSO

Each tenant gets its own auth state file:

```typescript
// auth.setup.ts
const tenants = ['acme', 'globex', 'initech'];

for (const tenant of tenants) {
  setup(`authenticate ${tenant}`, async ({ page }) => {
    await page.goto(`/login?tenant=${tenant}`);
    // ... tenant-specific login
    await page.context().storageState({
      path: `playwright/.auth/${tenant}.json`,
    });
  });
}
```

Use:
```typescript
test.use({ storageState: 'playwright/.auth/acme.json' });
test('Acme dashboard', async ({ page }) => { /* */ });
```

---

## Session Expiry Testing

Test what happens when a session expires mid-flow. Most apps have a 30-day session, testing requires shortcuts:

### Option A: Manipulate cookies
```typescript
test('session expiry redirects to login', async ({ page, context }) => {
  await page.goto('/dashboard');

  // Expire all auth cookies
  const cookies = await context.cookies();
  await context.clearCookies();
  for (const c of cookies) {
    await context.addCookies([{ ...c, expires: Math.floor(Date.now() / 1000) - 1 }]);
  }

  await page.reload();
  await expect(page).toHaveURL(/.*login/);
});
```

### Option B: Backend endpoint to expire a session
Test-only endpoint:
```typescript
test('session expiry mid-flow', async ({ page, request }) => {
  await page.goto('/dashboard');

  // Force expire from backend
  await request.post('/api/test/expire-session', {
    data: { userId: process.env.TEST_USER_ID },
  });

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(/session expired/i)).toBeVisible();
});
```

### Option C: Short-TTL test environment
Configure your test backend with 60-second sessions, then `await new Promise(r => setTimeout(r, 65_000))` (only acceptable when testing expiry itself).

---

## Auth Anti-Patterns (Currents.dev)

| Anti-pattern | Why bad | Fix |
|--------------|---------|-----|
| Single shared test user across all workers | Workers fight over session state | One account per worker |
| Credentials hardcoded in git | 23.8M secrets leaked in 2024 | Env vars + CI secrets only |
| Globally shared auth tokens (mid-run var) | Hidden cross-test dependency | Worker-scoped fixtures |
| Mocking OAuth as ONLY coverage | Misses real integration bugs | Mock + real (separate suite) |
| Testing only happy path | Lockouts/expired MFA invisible | Test failure paths too |
| `page.waitForTimeout()` after login | Flaky | `page.waitForURL()` or element wait |
| Leftover sessions between runs | State pollution | Use `testProject.outputDir` (auto-cleaned) |
| Hardcoded TOTP secret | Security risk | CI secret + rotation |
| TOTP code generated < 5s before expiry | Network latency expires it | Wait for fresh window |
| Mock without echoing OAuth `state` | CSRF check rejects callback | Always echo state param |

---

## Best Practices

1. **Mock for speed, real for correctness**, different test suites
2. **Per-worker accounts**, for state-mutating tests
3. **API-based auth setup**, 5-10x faster than UI
4. **TOTP timing window**, regenerate if < 5s remaining
5. **Magic link via API**, skip email in feature tests
6. **Multi-tenant = multi-storageState**, one file per tenant
7. **Real OAuth = sandbox tenant**, never share with prod
8. **Echo `state` in OAuth mocks**, required for CSRF check
9. **Test failure paths**, locked accounts, expired codes, denied scopes
10. **CI secrets, not env files**, for production-like envs

---

## Resources

- Currents auth guide: https://currents.dev/posts/testing-authentication-with-playwright-the-complete-guide
- Playwright auth: https://playwright.dev/docs/auth
- `otpauth`: https://www.npmjs.com/package/otpauth
- `oauth2-mock-server`: https://www.npmjs.com/package/oauth2-mock-server
