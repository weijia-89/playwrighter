# Reporters & Reporting

**Sources**: [Playwright Reporters Docs](https://playwright.dev/docs/test-reporters), [awesome-playwright reporters](https://github.com/mxschmitt/awesome-playwright)

Built-in reporters cover most needs. Third-party plugins add rich visualization, TCMS integration, and team notifications.

---

## Built-in Reporters

| Reporter | Use case |
|----------|----------|
| `list` | Default; concise terminal output |
| `line` | Single-line per file (less verbose) |
| `dot` | Compact dot-per-test (CI) |
| `html` | Interactive HTML report (local debug) |
| `blob` | Sharded CI; merge with `merge-reports` |
| `github` | GitHub Actions annotations |
| `json` | Machine-readable for tooling |
| `junit` | XML for Jenkins / GitLab / Azure |
| `null` | Suppress all output |

### Multiple reporters
```typescript
reporter: process.env.CI
  ? [['blob'], ['github'], ['junit', { outputFile: 'results.xml' }]]
  : 'html',
```

---

## Recommended Setups

### Local development
```typescript
reporter: 'html',
```
Run, then `npx playwright show-report`.

### CI with sharding
```typescript
reporter: process.env.CI
  ? [['blob'], ['github']]
  : 'html',
```
- `blob` produces output for `merge-reports`
- `github` annotates PR with failures inline

### Enterprise (Jenkins + Slack + Allure)
```typescript
reporter: process.env.CI ? [
  ['blob'],
  ['junit', { outputFile: 'junit.xml' }],
  ['allure-playwright'],
  ['playwright-slack-report', { slackWebHookUrl: process.env.SLACK_WEBHOOK }],
] : 'html',
```

---

## Allure (Industry Standard)

```bash
npm i -D allure-playwright allure-commandline
```

```typescript
reporter: [['allure-playwright', {
  detail: true,
  outputFolder: 'allure-results',
  suiteTitle: false,
}]],
```

Generate report:
```bash
npx allure generate allure-results --clean
npx allure open
```

Allure shows:
- Test suites with hierarchies
- Step-by-step actions (uses `test.step`)
- Screenshots/videos/traces inline
- Trends across runs
- Custom labels (severity, owner, ticket)

### Add metadata
```typescript
import { test } from '@playwright/test';
import { allure } from 'allure-playwright';

test('[TC-001] login @P0', async ({ page }) => {
  allure.severity('critical');
  allure.owner('auth-team');
  allure.tag('smoke');
  allure.link('https://jira.example.com/TC-001', 'jira');
  // ...
});
```

---

## Monocart (HTML grid + coverage)

```bash
npm i -D monocart-reporter
```

```typescript
reporter: 'monocart-reporter',
```

- Sortable HTML grid
- V8 code coverage built in
- Faster than Allure for large suites

---

## Team Notifications

### Slack

```bash
npm i -D playwright-slack-report
```

```typescript
reporter: [
  ['playwright-slack-report', {
    slackWebHookUrl: process.env.SLACK_WEBHOOK_URL!,
    sendResults: 'on-failure', // or 'always'
    showInThread: true,
    meta: [
      { key: 'Branch', value: process.env.GITHUB_REF_NAME },
      { key: 'Commit', value: process.env.GITHUB_SHA },
    ],
  }],
],
```

Sends test results to a channel with details and trace links.

### Microsoft Teams

For Teams, use a custom reporter that posts to an incoming webhook. Pattern:

```typescript
// teams-reporter.ts
import type { Reporter, FullResult } from '@playwright/test/reporter';

class TeamsReporter implements Reporter {
  onEnd(result: FullResult) {
    if (result.status !== 'passed') {
      fetch(process.env.TEAMS_WEBHOOK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@type': 'MessageCard',
          themeColor: 'D9302F',
          title: `Playwright tests ${result.status}`,
          text: `${result.startTime}: ${process.env.GITHUB_REF_NAME}`,
        }),
      });
    }
  }
}

export default TeamsReporter;
```

Or use a pre-built package: `playwright-msteams-reporter` (community).

---

## CTRF (Common Test Report Format)

For tool-agnostic reporting (works with TestDino, Tesults, etc.):

```bash
npm i -D playwright-ctrf-json-reporter
```

```typescript
reporter: [['playwright-ctrf-json-reporter']],
```

---

## TCMS Integration

| Reporter | TCMS |
|----------|------|
| `playwright-xray` | Jira Xray |
| `qase-playwright` | Qase |
| `testomatio-reporter` | Testomatio (Jira/Linear/Azure DevOps) |
| `playwright-tesults-reporter` | Tesults |

Pattern: each test gets a TCMS ID via tags or annotations:
```typescript
test('login', async ({ page }) => {
  test.info().annotations.push({ type: 'jiraKey', description: 'AUTH-123' });
});
```

---

## GitHub Actions Annotations

```typescript
reporter: process.env.CI ? [['github']] : 'html',
```

Failures appear inline on the PR:
```
::error file=tests/login.spec.ts,line=12::Expected page to have URL /dashboard
```

---

## Custom Reporter

For specialized needs:

```typescript
// custom-reporter.ts
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class MyReporter implements Reporter {
  onBegin(config, suite) {
    console.log(`Starting run with ${suite.allTests().length} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      // Send to PagerDuty, log to DB, etc.
    }
  }

  onEnd(result) {
    console.log(`Finished: ${result.status}`);
  }
}

export default MyReporter;
```

```typescript
// playwright.config.ts
reporter: './custom-reporter.ts',
```

---

## Sharding + Reports

When sharding tests across N machines:

1. Each shard uses `blob` reporter, uploads `blob-report/` as artifact
2. Merge job downloads all blobs, runs `npx playwright merge-reports --reporter html ./all-blob-reports`
3. Single combined HTML report

```yaml
# In CI (after sharded tests)
- run: npx playwright merge-reports --reporter html ./all-blob-reports
```

---

## Best Practices

1. **Always use `blob` on sharded CI**, only way to merge results
2. **Allure for enterprise**, rich, free, well-supported
3. **GitHub Actions reporter on PRs**, inline failure annotations
4. **Slack notifications for nightly/release**, not every PR
5. **CTRF for tool-agnostic**, future-proofs your reporting
6. **Don't over-engineer**, `html` + `blob` covers 90% of cases
7. **Attach artifacts to reports**, screenshots, traces, custom logs

---

## Anti-Patterns

```typescript
// ❌ Different reporter locally vs CI without HTML option
reporter: process.env.CI ? 'json' : 'html',
// CI failures hard to debug; no human-readable output

// ✅ Always include something human-readable
reporter: process.env.CI
  ? [['blob'], ['github'], ['html', { open: 'never' }]]
  : 'html',
```

```typescript
// ❌ Slack on every test run
reporter: [['playwright-slack-report', { sendResults: 'always' }]],
// Channel becomes noise

// ✅ Failures only
reporter: [['playwright-slack-report', { sendResults: 'on-failure' }]],
```

---

## Resources

- https://playwright.dev/docs/test-reporters
- Allure: https://allurereport.org/docs/playwright/
- Monocart: https://github.com/cenfun/monocart-reporter
- CTRF: https://ctrf.io
