# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Consumer bootstrap section in `templates/README.md` (templates → `tools/` → `npm run validate` / `score`); README enforcement map aligned with `validate-suite.sh` and `score-tests.js`.

### Changed

- Expanded inline rubric in `tools/score-tests.js` (category summaries, penalty tables, thresholds, limitations paraphrased from deleted scorecard); README fixture-import and non-scored guidance aligned with `scoreFile()`.
- Scorer CLI banner renamed to **Quality Rubric** (post–scorecard purge); fixture-import exemption accepts `./fixtures` and `../fixtures`.

## [3.1.1] - 2026-05-24

### Fixed

- `.cursor/rules/playwrighter.mdc`: repo-root paths, vendored-prefix note, `assertions.md` mandatory read, output contract, codegen, enforcement table, expanded globs; removed erroneous "devices registry" wording.
- `templates/`: copy `tools/` documented; `scripts/check-tools.js` guards `npm run validate` / `score`; POM assertions moved out of `LoginPage.expectError` into spec template.
- `patterns/anti-patterns.md`: POM assertion row aligned with `page-object-model.md` sanity-check carve-out.
- `README.md` / `GETTING_STARTED.md`: dual integration paths (repo root vs subfolder); `@playwright/test` ≥ 1.50.
- CI dogfood: run `validate-suite.sh` on northwind-qa before scorer.
- `tools/score-tests.js`: penalize `@playwright/test` imports in spec files (custom fixtures expected).

### Added

- `scripts/cursor-sdk/apply-harness-fixes.mjs`: optional Cursor SDK runner to re-apply harness fixes (`CURSOR_API_KEY` required).

## [3.1.0] - 2026-05-24

### Added

- `skill/SKILL.md` as the agent-agnostic canonical skill body.

### Changed

- `.cursor/rules/playwrighter.mdc` points at `skill/SKILL.md` instead of a vendor-specific path under `.claude/`.
- README and INDEX integration sections: install via `skill/SKILL.md` symlink; Cursor rule unchanged in purpose.

### Removed

- Repo-shipped `.claude/skills/playwrighter/` tree (use `skill/SKILL.md` + optional user symlink).

## [3.0.1] - 2026-05-24

### Removed

- Internal research and audit trail under `references/` (research indexes, adversarial reviews, duplicate quality-scorecard markdown). The public rubric is the inline comment block in `tools/score-tests.js`.

### Changed

- Expanded `tools/score-tests.js` inline rubric (penalty tables, thresholds, limitations); README penalty claims aligned with `scoreFile()`; split priority vs category tag checks; `.toBeFalsy()` penalty.
- README intro: soften scorer vs `anti-patterns.md` coverage claim (codereview F3).
