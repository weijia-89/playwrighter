# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Removed

- Internal research and audit trail under `references/` (research indexes, adversarial reviews, duplicate quality-scorecard markdown). The public rubric is the inline comment block in `tools/score-tests.js`.
- Expanded `tools/score-tests.js` inline rubric (penalty tables, thresholds, limitations); README penalty claims aligned with `scoreFile()`; split priority vs category tag checks; `.toBeFalsy()` penalty.
- README intro: soften scorer vs `anti-patterns.md` coverage claim (codereview F3).
