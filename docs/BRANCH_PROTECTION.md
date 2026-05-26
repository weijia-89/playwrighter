# Branch protection (`main`)

GitHub rules for **playwrighter** (`weijia-89/playwrighter`). Apply only after the operator confirms `GH_REPO`.

**Default target:** `weijia-89/playwrighter` (set explicitly; never assume from cwd alone).

## Current state (2026-05-25)

| Check | Result |
| ----- | ------ |
| Default branch | `main` |
| Visibility | **Public** |
| Manifest action | `apply` with `apply_live: true` when portfolio wave sets `APPLY=1` |
| Classic branch protection GET | **200** — protection already active on `main` |
| Required approvals | 1 |
| Dismiss stale reviews | yes |
| Require conversation resolution | yes |
| Force pushes / deletions on `main` | blocked |

Ord 14 portfolio wave for playwrighter is primarily **docs + script parity** on `chore/branch-protection-sdk`; live PUT is idempotent refresh of the policy below.

## Policy (script / live)

| Rule | Setting | Notes |
| ---- | ------- | ----- |
| Default branch | `main` | Confirmed via `gh repo view weijia-89/playwrighter`. |
| Require PR before merge | yes | Direct pushes to `main` blocked. |
| Require approvals | 1 | See [Solo maintainer tradeoff](#solo-maintainer-tradeoff). |
| Dismiss stale reviews | yes | New commits invalidate prior approvals. |
| Require conversation resolution | yes | Unresolved review threads block merge. |
| Require linear history | off | Enable if you want squash-only or rebase-only merges. |
| Force pushes | block on `main` | No `--force` to shared default branch. |
| Branch deletions | block on `main` | Prevents accidental removal of the default branch. |
| Enforce for admins | off | Admins can bypass unless you enable enforce. |
| Required status checks | none (placeholder) | Add when a required CI gate is chosen. |

## Solo maintainer tradeoff

With **required approving review count = 1**, GitHub expects someone other than the PR author to approve. On a solo personal repo that usually means:

- **Option A (strict):** keep `required_approving_review_count: 1` and use a second account, bot, or org rule exception.
- **Option B (pragmatic solo):** set count to `0` but keep **require PR** + conversation resolution.
- **Option C:** use bypass lists for specified actors if available on your plan.

The bundled script defaults to **count = 1**. Lower it in the JSON payload before apply if you choose Option B.

## Prerequisites

1. Remote repo exists: `gh repo view "$GH_REPO"`.
2. `gh` authenticated to **github.com**: `gh auth status`.
3. Default branch is `main` (or edit the script branch name).
4. Operator confirms **`GH_REPO=owner/name`** matches the intended repo.
5. For live apply: set **`APPLY=1`** before `DRY_RUN=0`.

## Apply via script (preferred)

From repo root:

```bash
cd ~/Projects/playwrighter
export GH_REPO=weijia-89/playwrighter

# Dry run (default) — prints JSON only
./scripts/apply_branch_protection.sh

# Apply (operator intent + APPLY=1)
APPLY=1 DRY_RUN=0 ./scripts/apply_branch_protection.sh
```

The script is idempotent when classic protection is in use: repeated `APPLY=1 DRY_RUN=0` runs send the same PUT payload.

## Manual UI steps

1. Open `https://github.com/weijia-89/playwrighter/settings/branches`.
2. Edit the rule for `main` or add one if missing.
3. Match the policy table above.

## Verify remote state

```bash
gh api repos/weijia-89/playwrighter/branches/main/protection
```

## References

- Portfolio manifest: `cursor-sdk-playground/prompts/portfolio_branch_protection_manifest.json` (row `playwrighter`).
- SDK wave: `cursor-sdk-playground/scripts/portfolio_branch_protection_wave.sh`.
