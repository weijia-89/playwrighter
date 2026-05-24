#!/usr/bin/env node
/**
 * Generate or refresh ARCH.MD via Cursor SDK (local agent).
 *
 * Usage:
 *   export CURSOR_API_KEY=...
 *   cd scripts/cursor-sdk && npm run generate-arch
 */
import { Agent, CursorAgentError } from '@cursor/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const archPath = path.join(repoRoot, 'ARCH.MD');

const PROMPT = `You are documenting the playwrighter repository architecture. Work only under ${repoRoot}.

Read these files (full or enough to be accurate):
- README.md, INDEX.md, skill/SKILL.md, .cursor/rules/playwrighter.mdc
- tools/validate-suite.sh, tools/score-tests.js (rubric comment + scoreFile)
- .github/workflows/dogfood-northwind-qa.yml
- templates/README.md, templates/fixtures.ts, templates/test-template.ts

Write or overwrite ${archPath} with:
1. Short prose: what playwrighter is (pattern library + templates + lint/score; not an app test suite in-repo).
2. At least four Mermaid diagrams:
   - System context (actors, playwrighter layers, consumer project, external northwind-qa CI)
   - In-repo layer flow (mdc → skill → patterns → templates → tools)
   - Agent sequence (rule → skill → patterns → write → validate → score)
   - Enforcement split (validate-suite.sh vs score-tests.js; errors vs warnings)
   - Optional: consumer bootstrap flowchart, CI dogfood, pattern mindmap
3. Tables for enforcement mapping and directory roles.
4. Section on regenerating via scripts/cursor-sdk/generate-arch.mjs

Use repo-root paths (skill/, patterns/, tools/). Do not invent components that are not in the tree.
Keep Mermaid valid (no spaces in node IDs; use subgraph labels for titles).
Do not commit unless asked.`;

const apiKey = process.env.CURSOR_API_KEY;
if (!apiKey) {
  console.error('CURSOR_API_KEY is not set. Export it or edit ARCH.MD manually.');
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
  if (fs.existsSync(archPath)) {
    console.log(`Updated: ${archPath}`);
  } else {
    console.log(`Created: ${archPath}`);
  }
  console.log(result.result ?? '(see ARCH.MD)');
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error('SDK startup failed:', err.message);
    process.exit(1);
  }
  throw err;
}
