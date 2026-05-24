# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
