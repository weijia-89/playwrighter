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
| `docs/BRANCH_PROTECTION.md` | present — policy table, solo-maintainer tradeoff, apply/verify commands |
| `scripts/apply_branch_protection.sh` | present, executable — `DRY_RUN=1` default, `GH_REPO=weijia-89/playwrighter` |
| This report | present |

## Repo snapshot (`gh repo view`)

| Check | Result |
| ----- | ------ |
| Default branch | main |
| Visibility | PUBLIC |
| viewerPermission | ADMIN |
| viewerCanAdminister | true |

## Live protection state (GET, no APPLY run this session)

`APPLY=1` was **not** set in the worker environment; live PUT was skipped per portfolio wave gate.

```bash
gh api repos/weijia-89/playwrighter/branches/main/protection
```

**HTTP 200** — classic branch protection already active on `main`:

| Setting | Live value |
| ------- | ---------- |
| required_approving_review_count | 1 |
| dismiss_stale_reviews | true |
| require_code_owner_reviews | false |
| required_conversation_resolution | true |
| allow_force_pushes | false |
| allow_deletions | false |
| enforce_admins | false |
| required_linear_history | false |

Live policy matches the script JSON payload. Idempotent refresh via `APPLY=1 DRY_RUN=0` is optional.

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

None. Public repo on free tier supports classic branch protection; admin access confirmed.

## Open TODOs

- Portfolio manifest row still lists `protected: "no"` — stale vs live GET; refresh manifest inventory on next wave scan.
- Optional: add required status checks when a canonical CI gate is chosen (script keeps `required_status_checks: null`).
- Solo maintainer: choose Option A/B/C in `docs/BRANCH_PROTECTION.md` if PR self-merge is blocked by approval count = 1.
