# Branch protection (`main`)

GitHub rules for **playwrighter** (`weijia-89/playwrighter`). Apply only after the operator confirms `GH_REPO`.

**Default target:** `weijia-89/playwrighter` (set explicitly; never assume from cwd alone).

## Current state (2026-05-25)

| Check | Result |
| ----- | ------ |
| Default branch | `main` |
| Visibility | **Public** |
| Manifest action | `apply` with `apply_live: true` when portfolio wave sets `APPLY=1` |
| Classic branch protection GET | **404** — not configured |
| Active repository rulesets | **3** (see [Rulesets (live)](#rulesets-live)) |
| CI workflows | **dogfood-northwind-qa** (`.github/workflows/dogfood-northwind-qa.yml`) |

`main` is protected today via **repository rulesets**, not classic branch protection. The bundled script applies classic protection (PUT API) when the operator runs `APPLY=1 DRY_RUN=0`; that is idempotent and complements or replaces rulesets depending on operator choice.

## Policy (script / recommended)

| Rule | Setting | Notes |
| ---- | ------- | ----- |
| Default branch | `main` | Confirmed via `gh repo view weijia-89/playwrighter`. |
| Require PR before merge | yes | Direct pushes to `main` blocked once protection is on. |
| Require approvals | 1 (script default) | See [Solo maintainer tradeoff](#solo-maintainer-tradeoff). |
| Dismiss stale reviews | yes | New commits invalidate prior approvals. |
| Require conversation resolution | yes | Unresolved review threads block merge. |
| Require linear history | off in script | Live rulesets currently enforce linear history. |
| Force pushes | block on `main` | No `--force` to shared default branch. |
| Branch deletions | block on `main` | Prevents accidental removal of the default branch. |
| Enforce for admins | off | Admins can bypass classic rules unless you enable enforce. |
| Required status checks | none (placeholder) | Add when a required CI gate is chosen. |

## Rulesets (live)

Three active rulesets target `~DEFAULT_BRANCH` (`main`):

| Name | Rules (summary) |
| ---- | ---------------- |
| `protect-main-review-gated` | deletion, code_quality, pull_request (0 approvals, conversation resolution), linear history, non_fast_forward |
| `play-protect` | deletion, non_fast_forward, linear history, pull_request |
| `pw-prot` | deletion, non_fast_forward, linear history, pull_request |

Inspect or consolidate in **Settings → Rules → Rulesets**. Classic PUT via the script does not remove existing rulesets.

## Solo maintainer tradeoff

With **required approving review count = 1**, GitHub expects someone other than the PR author to approve. On a solo personal repo that usually means:

- **Option A (strict):** keep `required_approving_review_count: 1` and use a second account, bot, or org rule exception.
- **Option B (pragmatic solo):** set count to `0` but keep **require PR** + conversation resolution (matches live `protect-main-review-gated` ruleset).
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

# Apply classic protection (operator intent + APPLY=1)
APPLY=1 DRY_RUN=0 ./scripts/apply_branch_protection.sh
```

The script is idempotent for classic protection: repeated `APPLY=1 DRY_RUN=0` runs send the same PUT payload. It refuses apply if `gh repo view` fails or `APPLY=1` is unset.

## Manual UI steps

1. Open `https://github.com/weijia-89/playwrighter/settings/rules` (rulesets) or **Settings → Branches** (classic).
2. Edit rules for `main` or add a rule if missing.
3. Match the policy table above.

## Verify remote state

Classic protection (404 = not configured):

```bash
gh api repos/weijia-89/playwrighter/branches/main/protection 2>&1 || true
```

Active rulesets:

```bash
gh api repos/weijia-89/playwrighter/rulesets
```

## References

- Portfolio manifest: `cursor-sdk-playground/prompts/portfolio_branch_protection_manifest.json` (row `playwrighter`).
- SDK wave: `cursor-sdk-playground/scripts/portfolio_branch_protection_wave.sh`.
