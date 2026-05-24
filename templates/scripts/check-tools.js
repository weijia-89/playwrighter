#!/usr/bin/env node
/**
 * Ensures playwrighter tools/ was copied into the consumer project.
 * Copy from the playwrighter repo: cp -r /path/to/playwrighter/tools ./tools
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const validate = path.join(root, 'tools', 'validate-suite.sh');
const score = path.join(root, 'tools', 'score-tests.js');

if (fs.existsSync(validate) && fs.existsSync(score)) {
  process.exit(0);
}

console.error(
  [
    'Missing ./tools/ (validate-suite.sh and score-tests.js).',
    'From your playwrighter checkout run:',
    '  cp -r /path/to/playwrighter/tools ./tools',
    '  chmod +x ./tools/validate-suite.sh',
  ].join('\n')
);
process.exit(2);
