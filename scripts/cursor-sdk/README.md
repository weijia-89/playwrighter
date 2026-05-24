# Cursor SDK harness fix runner

Optional automation for the playwrighter adversarial-review fixes (3.1.1). The fixes are already applied in-tree; use this to re-verify or re-apply on a fork.

## Prerequisites

- Node.js ≥ 18
- `CURSOR_API_KEY` from [Cursor dashboard](https://cursor.com/settings)

## Run

```bash
cd scripts/cursor-sdk
npm install
export CURSOR_API_KEY=your_key
npm run apply-fixes      # harness fixes (3.1.1 checklist)
npm run generate-arch    # refresh ARCH.MD + Mermaid diagrams
```

Uses `Agent.prompt()` with **local** runtime (`cwd` = playwrighter repo root) per the Cursor SDK docs.

## Without SDK

- Harness fixes: `CHANGELOG.md` [3.1.1] or IDE agent with `.cursor/rules/playwrighter.mdc`.
- Architecture: edit `ARCH.MD` at repo root (checked in; diagrams should match `skill/SKILL.md` and `tools/`).
