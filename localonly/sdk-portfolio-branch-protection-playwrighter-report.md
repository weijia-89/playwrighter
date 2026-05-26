# SDK report — portfolio-branch-protection-playwrighter

**Queue id:** portfolio-branch-protection-playwrighter  
**Repo:** weijia-89/playwrighter  
**Branch:** chore/branch-protection-sdk  
**Agent:** worker (Cursor SDK)  
**Date:** 2026-05-25

## Manifest row

| Field | Value |
| ----- | ----- |
| slug | playwrighter |
| gh_repo | weijia-89/playwrighter |
| default_branch | main |
| visibility | PUBLIC |
| action | apply |
| apply_live | true |
| branch | chore/branch-protection-sdk |

## Deliverables

| Path | Status |
| ---- | ------ |
| `docs/BRANCH_PROTECTION.md` | refreshed — ruleset-aware current state, policy table, apply/verify commands |
| `scripts/apply_branch_protection.sh` | present, executable — `DRY_RUN=1` default, `GH_REPO=weijia-89/playwrighter` |
| This report | refreshed |

## Repo snapshot (`gh repo view`)

| Check | Result |
| ----- | ------ |
| Default branch | main |
| Visibility | PUBLIC |
| viewerPermission | ADMIN |

## Live protection state (GET, no APPLY run this session)

`APPLY=1` was **not** set in the worker environment; live PUT was skipped per portfolio wave gate.

### Classic branch protection

```bash
gh api repos/weijia-89/playwrighter/branches/main/protection
```

**HTTP 404** — `Branch not protected` (classic API not configured).

### Repository rulesets

```bash
gh api repos/weijia-89/playwrighter/rulesets
```

**HTTP 200** — three active rulesets on `~DEFAULT_BRANCH`:

| ID | Name | Enforcement | Rules |
| -- | ---- | ----------- | ----- |
| 16807976 | protect-main-review-gated | active | deletion, code_quality, pull_request (0 approvals, conversation resolution), required_linear_history, non_fast_forward |
| 16852424 | play-protect | active | deletion, non_fast_forward, required_linear_history, pull_request |
| 16847876 | pw-prot | active | deletion, non_fast_forward, required_linear_history, pull_request |

`main` is protected via rulesets today. Classic PUT from the script would add classic branch protection (manifest `apply_live: true`); operator may consolidate overlapping rulesets after apply.

## Verification

```bash
test -f "/Users/wjia/Projects/playwrighter/docs/BRANCH_PROTECTION.md"
test -x "/Users/wjia/Projects/playwrighter/scripts/apply_branch_protection.sh"
```

**Result:** PASS

```bash
./scripts/apply_branch_protection.sh
```

**Result:** PASS — dry-run prints target `weijia-89/playwrighter`, JSON payload, exit 0.

```bash
bash -n scripts/apply_branch_protection.sh
```

**Result:** PASS

## Operator: live apply (when needed)

```bash
cd ~/Projects/playwrighter
APPLY=1 DRY_RUN=0 GH_REPO=weijia-89/playwrighter ./scripts/apply_branch_protection.sh
gh api repos/weijia-89/playwrighter/branches/main/protection
```

## Blockers

None for docs/script delivery. Classic PUT requires `APPLY=1`; rulesets already enforce PR + linear history on `main`.

## Open TODOs

- Portfolio manifest row lists `protected: "no"` — stale vs live rulesets; refresh manifest inventory on next wave scan.
- Consider consolidating three overlapping rulesets on `main`.
- Optional: add required status checks when a canonical CI gate is chosen (script keeps `required_status_checks: null`).
- Solo maintainer: live `protect-main-review-gated` uses 0 approvals; script defaults to 1 — align if desired.
