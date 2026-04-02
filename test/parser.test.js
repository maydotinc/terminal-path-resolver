const test = require('node:test');
const assert = require('node:assert/strict');

const { parsePathMatches } = require('../out/parser.js');

test('parses absolute Unix paths', () => {
  const [match] = parsePathMatches('/repo/apps/web/src/page.tsx:12:3');

  assert.equal(match.originalPath, '/repo/apps/web/src/page.tsx');
  assert.equal(match.line, 11);
  assert.equal(match.col, 2);
  assert.equal(match.pathKind, 'unix-absolute');
});

test('parses Windows paths without confusing drive letters for line separators', () => {
  const [match] = parsePathMatches('C:\\repo\\apps\\web\\src\\page.tsx:12:3');

  assert.equal(match.originalPath, 'C:\\repo\\apps\\web\\src\\page.tsx');
  assert.equal(match.line, 11);
  assert.equal(match.col, 2);
  assert.equal(match.pathKind, 'windows-absolute');
});

test('parses task-prefixed relative Turbo paths', () => {
  const [match] = parsePathMatches('web:dev: src/page.tsx:12:3');

  assert.equal(match.originalPath, 'src/page.tsx');
  assert.deepEqual(match.taskTokens, ['web', 'dev']);
});

test('ignores ANSI escapes while preserving the rendered path range', () => {
  const line = '\u001b[31m/Users/me/repo/apps/web/src/page.tsx:12:3\u001b[0m';
  const [match] = parsePathMatches(line);

  assert.equal(match.originalPath, '/Users/me/repo/apps/web/src/page.tsx');
  assert.equal(line.slice(match.startIndex, match.startIndex + match.length), '/Users/me/repo/apps/web/src/page.tsx:12:3');
});

test('handles trailing punctuation in stack traces', () => {
  const [match] = parsePathMatches('at /repo/apps/web/src/page.tsx:120:45)');

  assert.equal(match.originalPath, '/repo/apps/web/src/page.tsx');
  assert.equal(match.line, 119);
  assert.equal(match.col, 44);
});

test('reassembles wrapped paths split across lines', () => {
  const [match] = parsePathMatches('/repo/apps/web/src/\n  page.tsx:12:3');

  assert.equal(match.originalPath, '/repo/apps/web/src/page.tsx');
  assert.equal(match.line, 11);
  assert.equal(match.col, 2);
});

test('reassembles wrapped line and column suffixes across lines', () => {
  const [match] = parsePathMatches('web:dev: src/page.tsx:\n  12:3');

  assert.equal(match.originalPath, 'src/page.tsx');
  assert.equal(match.line, 11);
  assert.equal(match.col, 2);
});
