const test = require('node:test');
const assert = require('node:assert/strict');

const { parsePathMatches } = require('../out/parser.js');
const { hasClearBestCandidate, rankCandidates } = require('../out/resolutionEngine.js');

function createCandidate(workspaceRelativePath, workspaceFolderName = 'repo') {
  return {
    fsPath: `/workspace/${workspaceRelativePath}`,
    absoluteComparablePath: `workspace/${workspaceRelativePath}`,
    workspaceFolderName,
    workspaceFolderPath: '/workspace',
    workspaceRelativePath,
    normalizedWorkspaceRelativePath: workspaceRelativePath,
    comparablePath: workspaceRelativePath,
    basename: workspaceRelativePath.split('/').at(-1),
    segments: workspaceRelativePath.split('/'),
  };
}

test('prefers exact workspace-relative matches', () => {
  const parsedPath = parsePathMatches('apps/web/src/page.tsx:12:3')[0];
  const ranked = rankCandidates(
    [
      createCandidate('apps/admin/src/page.tsx'),
      createCandidate('apps/web/src/page.tsx'),
    ],
    parsedPath
  );

  assert.equal(ranked[0].candidate.workspaceRelativePath, 'apps/web/src/page.tsx');
  assert.ok(hasClearBestCandidate(ranked));
});

test('uses terminal cwd as the strongest ambiguous-match signal', () => {
  const parsedPath = parsePathMatches('src/page.tsx:12:3')[0];
  const ranked = rankCandidates(
    [
      createCandidate('apps/admin/src/page.tsx'),
      createCandidate('apps/web/src/page.tsx'),
    ],
    parsedPath,
    {
      cwdPath: '/workspace/apps/web',
      cwdComparablePath: 'workspace/apps/web',
      tokens: ['web', 'dev'],
    }
  );

  assert.equal(ranked[0].candidate.workspaceRelativePath, 'apps/web/src/page.tsx');
  assert.ok(hasClearBestCandidate(ranked));
});

test('uses Turborepo task tokens to rank duplicated relative paths', () => {
  const parsedPath = parsePathMatches('web:dev: src/page.tsx:12:3')[0];
  const ranked = rankCandidates(
    [
      createCandidate('apps/admin/src/page.tsx'),
      createCandidate('apps/web/src/page.tsx'),
    ],
    parsedPath
  );

  assert.equal(ranked[0].candidate.workspaceRelativePath, 'apps/web/src/page.tsx');
  assert.ok(hasClearBestCandidate(ranked));
});

test('treats duplicated candidates without a clear best as ambiguous', () => {
  const parsedPath = parsePathMatches('src/index.ts:9:1')[0];
  const ranked = rankCandidates(
    [
      createCandidate('apps/admin/src/index.ts'),
      createCandidate('packages/api/src/index.ts'),
    ],
    parsedPath
  );

  assert.equal(ranked.length, 2);
  assert.equal(hasClearBestCandidate(ranked), false);
});

test('supports matching foreign absolute paths by suffix', () => {
  const parsedPath = parsePathMatches('C:\\repo\\apps\\web\\src\\page.tsx:12:3')[0];
  const ranked = rankCandidates([createCandidate('apps/web/src/page.tsx')], parsedPath);

  assert.equal(ranked[0].candidate.workspaceRelativePath, 'apps/web/src/page.tsx');
});
