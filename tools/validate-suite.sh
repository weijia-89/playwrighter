#!/usr/bin/env bash
#
# validate-suite.sh — Lint Playwright test suites for known anti-patterns.
#
# Usage:
#   ./validate-suite.sh [path]      # default: ./tests
#   ./validate-suite.sh --strict    # exit 1 on warnings too
#   ./validate-suite.sh --eslint    # also run the consumer's eslint-plugin-playwright (see templates/eslint.config.mjs)
#
# Exit codes:
#   0 = no errors
#   1 = anti-patterns found
#   2 = invocation error

set -uo pipefail

# Parse flags + positional path (any order)
TARGET=""
STRICT=0
ESLINT=0
for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=1 ;;
    --eslint) ESLINT=1 ;;
    --help|-h)
      echo "Usage: $0 [path] [--strict]"
      echo "  path:    test directory (default ./tests)"
      echo "  --strict: exit 1 on warnings too"
      echo "  --eslint: also run the consumer eslint-plugin-playwright, if installed"
      exit 0
      ;;
    --*)
      echo "Unknown flag: $arg" >&2
      exit 2
      ;;
    *) TARGET="$arg" ;;
  esac
done
TARGET="${TARGET:-./tests}"

if [[ ! -d "$TARGET" ]]; then
  echo "Error: path not found: $TARGET" >&2
  exit 2
fi

ERRORS=0
WARNINGS=0
GREP_OPTS=(-rn --include='*.ts' --include='*.js' --exclude-dir=node_modules)

# Indent matches; strip control chars so a hostile test file cannot inject terminal escapes
indent() { LC_ALL=C tr -d '\000-\010\013-\037' | sed 's/^/   /'; }

# Only colorize if stdout is a TTY
if [[ -t 1 ]]; then
  red()    { printf "\033[31m%s\033[0m\n" "$*"; }
  yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
  green()  { printf "\033[32m%s\033[0m\n" "$*"; }
else
  red()    { printf "%s\n" "$*"; }
  yellow() { printf "%s\n" "$*"; }
  green()  { printf "%s\n" "$*"; }
fi

# Run grep over TARGET into SCAN_OUT. rc>1 (unreadable file etc.) aborts instead of reporting a false "clean".
scan() {
  local rc
  SCAN_OUT=$(grep "${GREP_OPTS[@]}" -E "$1" -- "$TARGET" 2>/dev/null); rc=$?
  if (( rc > 1 )); then echo "Error: grep failed (rc=$rc) scanning $TARGET" >&2; exit 2; fi
}

check_error() {
  local pattern="$1"
  local label="$2"
  local matches
  scan "$pattern"; matches=$SCAN_OUT
  if [[ -n "$matches" ]]; then
    red "❌ ERROR: $label"
    echo "$matches" | indent
    ERRORS=$((ERRORS + 1))
  fi
}

check_warning() {
  local pattern="$1"
  local label="$2"
  local matches
  scan "$pattern"; matches=$SCAN_OUT
  if [[ -n "$matches" ]]; then
    yellow "⚠️  WARN: $label"
    echo "$matches" | indent
    WARNINGS=$((WARNINGS + 1))
  fi
}

echo "Scanning $TARGET for anti-patterns..."
echo

# Hard errors
check_error "waitForTimeout\(" \
  "waitForTimeout() — use web-first assertions instead"

check_error "waitForLoadState\(['\"]networkidle['\"]\)" \
  "networkidle — never resolves on SPAs"

check_error "expect\(await .*\.isVisible\(\)\)" \
  "Manual isVisible() — use await expect(x).toBeVisible() for auto-retry"

check_error "expect\(await .*\.textContent\(\)\)" \
  "Manual textContent() — use await expect(x).toHaveText/toContainText"

check_error "\.toBeTruthy\(\)" \
  ".toBeTruthy() — use specific matcher (toBeVisible, toHaveCount, etc.)"

check_error "test\.only\(" \
  ".only() left in code — fails CI via forbidOnly"

check_error "page\.pause\(\)" \
  "page.pause() left in code — pauses test execution"

# Matcherless expect: asserts nothing, test can never fail. Single-line form only;
# a custom matcher not named to[A-Z]* would false-positive.
scan '^[[:space:]]*(await +)?expect(\.soft)?\(.*\)[[:space:]]*;[[:space:]]*$'
matchless=$(grep -vE '\)\.(not\.)?(to[A-Z]|resolves|rejects)' <<<"$SCAN_OUT" || true)
if [[ -n "$matchless" ]]; then
  red "❌ ERROR: expect() with no matcher — asserts nothing"
  echo "$matchless" | indent
  ERRORS=$((ERRORS + 1))
fi

# Warnings
check_warning "page\.locator\(['\"][^'\"]*\\.[a-z]" \
  "CSS class locator — prefer getByRole/getByLabel"

check_warning "nth-child\(|nth-of-type\(" \
  "nth-child selector — fragile; prefer .filter() or first()/nth()"

check_warning "xpath=" \
  "XPath locator — prefer accessible locators"

check_warning "page\.\\\$\(" \
  "page.\$() is deprecated — use page.locator()"

check_warning "page\.click\(['\"]text=" \
  "text= selector — prefer getByText() / getByRole(name:)"

check_warning "setTimeout\(" \
  "setTimeout in test code — use web-first assertions"

check_warning "\{ *force: *true *\}" \
  "force: true bypasses actionability checks — use sparingly"

check_warning "test\.fixme\(.*\{ *\} *\) *;" \
  "empty-body test.fixme — placeholder, not a quarantine; add owner/ticket/expiry or delete"

check_warning "if *\(await " \
  "Conditional in test (if (await ...)) — split into separate tests instead"

# Optional AST-based pass: the consumer's own eslint + eslint-plugin-playwright (nothing is installed here)
if [[ $ESLINT -eq 1 ]]; then
  echo
  if npx --no-install eslint --version >/dev/null 2>&1; then
    echo "Running eslint on $TARGET..."
    npx --no-install eslint -- "$TARGET" || ERRORS=$((ERRORS + 1))
  else
    yellow "⚠️  --eslint: eslint not installed here; grep checks only (see templates/eslint.config.mjs)"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Reports
echo
if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
  green "✅ Suite clean — no anti-patterns detected"
  exit 0
fi

echo "------------------------------------"
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo "------------------------------------"

if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi

if [[ $STRICT -eq 1 && $WARNINGS -gt 0 ]]; then
  exit 1
fi

exit 0
