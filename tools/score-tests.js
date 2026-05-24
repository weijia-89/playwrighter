#!/usr/bin/env node
/**
 * score-tests.js — Score Playwright test files against the quality rubric.
 * Rubric definitions live in the comment block below (canonical source).
 *
 * Usage:
 *   node tools/score-tests.js [path]       # default ./tests
 *   node tools/score-tests.js --json       # machine-readable output
 *   node tools/score-tests.js --threshold=80
 *
 * Exit codes:
 *   0 = all tests at or above threshold (default 80)
 *   1 = at least one test below threshold
 */

'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const threshold = (() => {
  const a = args.find((x) => x.startsWith('--threshold='));
  return a ? parseInt(a.split('=')[1], 10) : 80;
})();
const target = args.find((a) => !a.startsWith('--')) || './tests';

if (!fs.existsSync(target)) {
  console.error(`Error: path not found: ${target}`);
  process.exit(2);
}

// --- Rubric (100 points total; ground truth = scoreFile() below) ---
//
// Categories (weights):
//   Reliability 25 | Maintainability 20 | Completeness 25 | Coverage 15 | Execution 15
//
// Reliability (25 max) — flaky / non–web-first patterns
//   -10  waitForTimeout()
//   -10  waitForLoadState('networkidle')
//    -5  expect(await x.isVisible()) (manual assertion shape)
//    -5  .toBeTruthy() or .toBeFalsy()
//    -5  page.pause() left in code
//    -3  test.only() left in code
//    -3  if (await ...) conditional (split tests instead)
//    -2  { force: true } (bypasses actionability)
//
// Maintainability (20 max) — locator stability
//    -2 per CSS class/id inside .locator('…') (cap -10 total)
//    -5  nth-child() / nth-of-type()
//    -5  xpath= selector
//   (Not scored here: getByRole vs getByText — see patterns/ + validate-suite.sh)
//   Spec files should import ./fixtures (-5 if @playwright/test only in .spec/.test files)
//
// Completeness (25 max) — traceability and assertions
//    -3 per test missing [TC-XXX] in title (cap -10)
//   -15  no expect() in file
//    -5  fewer expect() calls than test() calls
//
// Coverage (15 max) — tags for triage / CI filters
//    -5  no @P0–@P3 priority tag in file
//    -5  no @smoke / @regression / @critical / @a11y category tag in file
//
// Execution (15 max) — file size
//    -5  file > 400 lines (consider splitting)
//   (Not scored here: per-test >100 lines, test.step() — manual review / patterns/test-structure.md)
//
// Thresholds (CLI default --threshold=80): 70+ feature branch, 80+ main, 90+ production, 95+ exemplary.
//
// Limitations: regex/AST surface checks only — not test value, behavior coverage, data quality,
// locator stability over time, or failure debuggability. Pair with code review.

function findTestFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findTestFiles(full));
    else if (/\.(spec|test)\.(ts|js)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function scoreFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  let score = 100;

  // Quick sanity: must contain at least one test() to score
  const testCountQuick = (content.match(/\btest\(/g) || []).length;
  if (testCountQuick === 0) {
    return {
      file: filePath,
      score: null,
      skipped: true,
      findings: [{ severity: 'info', msg: 'no test() calls; skipped' }],
    };
  }

  // --- Reliability (-25 max) ---
  if (/waitForTimeout\(/.test(content)) {
    score -= 10;
    findings.push({ severity: 'error', msg: 'waitForTimeout() detected' });
  }
  if (/waitForLoadState\(['"]networkidle['"]\)/.test(content)) {
    score -= 10;
    findings.push({ severity: 'error', msg: 'networkidle detected' });
  }
  if (/expect\(await .*\.isVisible\(\)\)/.test(content)) {
    score -= 5;
    findings.push({ severity: 'error', msg: 'manual isVisible() detected' });
  }
  if (/\.toBeTruthy\(\)|\.toBeFalsy\(\)/.test(content)) {
    score -= 5;
    findings.push({ severity: 'error', msg: '.toBeTruthy() / .toBeFalsy() detected' });
  }
  if (/test\.only\(/.test(content)) {
    score -= 3;
    findings.push({ severity: 'error', msg: 'test.only() detected' });
  }
  if (/page\.pause\(\)/.test(content)) {
    score -= 5;
    findings.push({ severity: 'error', msg: 'page.pause() left in code' });
  }
  if (/if\s*\(\s*await /.test(content)) {
    score -= 3;
    findings.push({ severity: 'warning', msg: 'conditional in test (if-await); split tests instead' });
  }
  if (/\{\s*force:\s*true\s*\}/.test(content)) {
    score -= 2;
    findings.push({ severity: 'warning', msg: 'force: true bypasses actionability checks' });
  }
  const isSpecFile = /\.(spec|test)\.(ts|js)$/.test(filePath);
  if (
    isSpecFile &&
    /from\s+['"]@playwright\/test['"]/.test(content) &&
    !/from\s+['"]\.\/fixtures['"]/.test(content)
  ) {
    score -= 5;
    findings.push({
      severity: 'warning',
      msg: 'spec imports @playwright/test directly; use custom fixtures (./fixtures)',
    });
  }

  // --- Maintainability (-20 max) ---
  // Catch CSS class/id selectors anywhere in .locator() calls (including chains)
  // Matches: page.locator('.foo'), .locator('#x'), .locator('div.bar'), parent.locator('#y')
  const cssLocatorMatches = (
    content.match(/\.locator\(['"`][^'"`]*[.#][a-zA-Z][^'"`]*['"`]/g) || []
  ).length;
  if (cssLocatorMatches > 0) {
    const penalty = Math.min(cssLocatorMatches * 2, 10);
    score -= penalty;
    findings.push({
      severity: 'warning',
      msg: `${cssLocatorMatches} CSS class/id locator(s); prefer getByRole/getByLabel`,
    });
  }
  if (/nth-child\(|nth-of-type\(/.test(content)) {
    score -= 5;
    findings.push({ severity: 'warning', msg: 'nth-child/nth-of-type selector' });
  }
  if (/xpath=/.test(content)) {
    score -= 5;
    findings.push({ severity: 'warning', msg: 'XPath selector' });
  }

  // --- Completeness (-25 max) ---
  const testCount = (content.match(/\btest\(/g) || []).length;
  const tcIdMatches = (content.match(/\[TC-\d+\]/g) || []).length;
  if (testCount > 0 && tcIdMatches < testCount) {
    const missing = testCount - tcIdMatches;
    const penalty = Math.min(missing * 3, 10);
    score -= penalty;
    findings.push({
      severity: 'warning',
      msg: `${missing}/${testCount} tests missing [TC-XXX] ID`,
    });
  }

  const expectCount = (content.match(/\bexpect\(/g) || []).length;
  if (testCount > 0 && expectCount === 0) {
    score -= 15;
    findings.push({ severity: 'error', msg: 'no expect() assertions found' });
  } else if (testCount > 0 && expectCount < testCount) {
    score -= 5;
    findings.push({
      severity: 'warning',
      msg: `${testCount} tests but only ${expectCount} assertions`,
    });
  }

  // --- Coverage (-15 max) ---
  if (testCount > 0 && !/@P[0-3]/.test(content)) {
    score -= 5;
    findings.push({
      severity: 'warning',
      msg: 'no priority tag (@P0–@P3)',
    });
  }
  if (testCount > 0 && !/@(smoke|regression|critical|a11y)/.test(content)) {
    score -= 5;
    findings.push({
      severity: 'warning',
      msg: 'no category tag (@smoke, @regression, @critical, @a11y)',
    });
  }

  // --- Execution (-15 max) ---
  const lines = content.split('\n').length;
  if (lines > 400) {
    score -= 5;
    findings.push({
      severity: 'warning',
      msg: `large file (${lines} lines); consider splitting`,
    });
  }

  return { file: filePath, score: Math.max(score, 0), findings };
}

const files = findTestFiles(target);
if (files.length === 0) {
  console.error(`No test files found in ${target}`);
  process.exit(2);
}

const allResults = files.map(scoreFile);
const results = allResults.filter((r) => !r.skipped);
const skipped = allResults.filter((r) => r.skipped);
const failing = results.filter((r) => r.score < threshold);
const avg = results.length
  ? results.reduce((sum, r) => sum + r.score, 0) / results.length
  : 0;

if (jsonOutput) {
  console.log(
    JSON.stringify(
      {
        target,
        threshold,
        average: Math.round(avg * 10) / 10,
        files: allResults,
        failingCount: failing.length,
        skippedCount: skipped.length,
      },
      null,
      2
    )
  );
} else {
  console.log(`\nQuality Scorecard — ${target}`);
  console.log(`Threshold: ${threshold}/100\n`);
  for (const r of results.sort((a, b) => a.score - b.score)) {
    const status = r.score >= threshold ? '✅' : '❌';
    console.log(`${status} ${r.score}/100  ${path.relative(process.cwd(), r.file)}`);
    for (const f of r.findings) {
      const icon = f.severity === 'error' ? '🔴' : '🟡';
      console.log(`     ${icon} ${f.msg}`);
    }
  }
  if (skipped.length > 0) {
    console.log(`\nSkipped (no test() calls):`);
    for (const r of skipped) {
      console.log(`  - ${path.relative(process.cwd(), r.file)}`);
    }
  }
  console.log(`\nAverage: ${Math.round(avg * 10) / 10}/100`);
  console.log(`Files below threshold: ${failing.length}/${results.length}`);
}

process.exit(failing.length > 0 ? 1 : 0);
