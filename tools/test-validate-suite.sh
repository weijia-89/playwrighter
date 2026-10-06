#!/usr/bin/env bash
# Regression tests for validate-suite.sh. Usage: ./tools/test-validate-suite.sh
set -uo pipefail
V="$(cd "$(dirname "$0")" && pwd)/validate-suite.sh"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
# t NAME EXPECTED_EXIT "FILE CONTENT" [grep-pattern-that-must-match-output|!pattern-that-must-not] [flags]
t() {
  local name="$1" want="$2" body="$3" pat="${4:-}" flag="${5:-}"
  rm -rf "$T/d"; mkdir -p "$T/d"; printf '%s\n' "$body" > "$T/d/a.spec.ts"
  local out; out=$(bash "$V" "$T/d" $flag 2>&1); local got=$?
  local ok=1
  [[ $got -eq $want ]] || ok=0
  if [[ -n "$pat" ]]; then
    if [[ "$pat" == '!'* ]]; then grep -qE -- "${pat#!}" <<<"$out" && ok=0
    else grep -qE -- "$pat" <<<"$out" || ok=0; fi
  fi
  if [[ $ok -eq 1 ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: $name (exit $got, want $want)"; fi
}
t "clean suite"              0 "await expect(page).toBeVisible();" "clean"
t "matcherless expect"       1 "  expect(page.getByRole('heading'));" "no matcher"
t "matcherless awaited"      1 "await expect(a);" "no matcher"
t "matcherless soft"         1 "await expect.soft(a);" "no matcher"
t "matcher present"          0 "await expect(a).toHaveText('x');" "!no matcher"
t "negated matcher"          0 "await expect(a).not.toBeVisible();" "!no matcher"
t "resolves matcher"         0 "await expect(p).resolves.toBe(1);" "!no matcher"
t "chained locator matcher"  0 "await expect(page.getByRole('a').first()).toBeVisible();" "!no matcher"
t "commented expect"         0 "// expect(a);" "!no matcher"
t "multi-line expect"        0 $'await expect(a)\n  .toBeVisible();' "!no matcher"
t "empty fixme warns"        0 "test.fixme('x', { tag: '@a' }, () => {});" "empty-body"
t "empty async fixme warns"  0 "test.fixme('x', async ({ page }) => {});" "empty-body"
t "fixme with body"          0 "test.fixme('x', async () => { await foo(); });" "!empty-body"
t "fixme warn + strict"      1 "test.fixme('x', () => {});" "empty-body" "--strict"
t "waitForTimeout error"     1 "await page.waitForTimeout(100);" "waitForTimeout"
t "control chars stripped"   1 $'await page.waitForTimeout(1); // \033[31mX' '!'$'\033'
# node_modules excluded, dash-leading dir, invocation errors
rm -rf "$T/d"; mkdir -p "$T/d/node_modules/x"; echo "expect(a);" > "$T/d/node_modules/x/a.spec.ts"
bash "$V" "$T/d" >/dev/null 2>&1 && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: node_modules excluded"; }
mkdir -p "$T/-dash"; echo "expect(a);" > "$T/-dash/a.spec.ts"
(cd "$T" && bash "$V" -dash >/dev/null 2>&1); [[ $? -ne 0 ]] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: dash-leading dir"; }
bash "$V" "$T/nope" >/dev/null 2>&1; [[ $? -eq 2 ]] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: missing path exit 2"; }
rm -rf "$T/d"; mkdir -p "$T/d"; echo "expect(a);" > "$T/d/a.spec.ts"; chmod 000 "$T/d/a.spec.ts"
if [[ -r "$T/d/a.spec.ts" ]]; then echo "skip: unreadable-file test (running as root?)"
else bash "$V" "$T/d" >/dev/null 2>&1; [[ $? -eq 2 ]] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: unreadable file must not report clean"; }; fi
chmod 644 "$T/d/a.spec.ts"
# Parity: grep findings on the fixture must be a subset of eslint-plugin-playwright's.
# ESLINT_PARITY_DIR = dir with eslint, the plugin and templates/eslint.config.mjs copied in as eslint.config.mjs.
FX="$(cd "$(dirname "$0")" && pwd)/fixtures/parity.spec.ts"
mine=$(bash "$V" "$(dirname "$FX")" 2>&1 | grep -oE 'parity\.spec\.ts:[0-9]+' | cut -d: -f2 | sort -nu | tr '\n' ' ')
[[ "$mine" == "4 8 13 18 22 26 " ]] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: parity fixture lines (got: $mine)"; }
if [[ -n "${ESLINT_PARITY_DIR:-}" ]]; then
  rm -rf "$ESLINT_PARITY_DIR/fx"; mkdir "$ESLINT_PARITY_DIR/fx"; cp "$FX" "$ESLINT_PARITY_DIR/fx/"
  theirs=$(cd "$ESLINT_PARITY_DIR" && npx --no-install eslint fx 2>&1 | grep -oE '^ +[0-9]+' | tr -d ' ' | sort -nu | tr '\n' ' ')
  missing=""; for l in $mine; do [[ " $theirs" == *" $l "* ]] || missing="$missing $l"; done
  [[ -z "$missing" ]] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: grep flags lines eslint does not:$missing"; }
else echo "skip: eslint parity (set ESLINT_PARITY_DIR)"; fi
echo "passed $pass, failed $fail"; [[ $fail -eq 0 ]]
