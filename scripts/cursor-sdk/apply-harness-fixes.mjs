#!/usr/bin/env node
/**
 * Re-apply playwrighter harness fixes using the Cursor SDK (local agent).
 *
 * Usage (from playwrighter repo root):
 *   export CURSOR_API_KEY=...
 *   cd scripts/cursor-sdk && npm install && npm run apply-fixes
 *
 * Idempotent with respect to 3.1.1: safe to re-run; agent should no-op if already fixed.
 */
import { Agent, CursorAgentError } from '@cursor/sdk';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const PROMPT = `You are fixing the playwrighter repo harness after an adversarial review. Work only under ${repoRoot}.

Verify and fix if still broken:

P0: .cursor/rules/playwrighter.mdc uses repo-root paths (skill/, patterns/, tools/), vendored playwrighter/ prefix note, assertions.md in mandatory reads, no "devices registry" hallucination.

P1: templates/README.md and GETTING_STARTED.md document copying tools/; templates/scripts/check-tools.js exists; templates/package.json validate/score use check-tools; LoginPage has no expectError (assertions in spec); anti-patterns.md POM row matches page-object-model sanity carve-out.

P2: tools/score-tests.js warns on @playwright/test imports in .spec/.test files; .github/workflows/dogfood-northwind-qa.yml runs validate-suite.sh before score-tests; playwrighter.mdc enforcement table documents validate vs scorer.

P3: playwrighter.mdc globs include fixtures, setup, pages; README integration has repo-root vs subfolder symlink instructions; README requires @playwright/test >= 1.50; INDEX version 3.1.1 dated 2026-05-24.

Run: node tools/score-tests.js on any local .spec.ts if present. Do not commit unless asked.

When done, print a one-line summary of files changed or "already compliant".`;

const apiKey = process.env.CURSOR_API_KEY;
if (!apiKey) {
  console.error('CURSOR_API_KEY is not set. Export it or run fixes in the IDE agent instead.');
  process.exit(1);
}

try {
  const result = await Agent.prompt(PROMPT, {
    apiKey,
    model: { id: 'composer-2.5' },
    local: { cwd: repoRoot },
  });
  if (result.status === 'error') {
    console.error('Agent run failed:', result.id);
    process.exit(2);
  }
  console.log(result.result ?? '(no text result)');
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error('SDK startup failed:', err.message, 'retryable=', err.isRetryable);
    process.exit(1);
  }
  throw err;
}
