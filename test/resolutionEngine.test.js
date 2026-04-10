const test = require('node:test');
const assert = require('node:assert/strict');

const { parsePathMatches } = require('../out/parser.js');
const {
  hasClearBestCandidate,
  rankCandidates,
  rankSuggestedCandidates,
} = require('../out/resolutionEngine.js');
const { buildQuickOpenQuery } = require('../out/pathUtils.js');

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

test('suggests likely files when there is no exact suffix match', () => {
  const parsedPath = parsePathMatches('./components/booking-overview/upcoming-bookings.tsx:80:54')[0];
  const ranked = rankSuggestedCandidates(
    [
      createCandidate('apps/customer/components/booking-overview/upcoming-bookings.tsx'),
      createCandidate('apps/customer/components/booking-overview/past-bookings.tsx'),
      createCandidate('packages/ui/src/button.tsx'),
    ],
    parsedPath,
    {
      tokens: ['employee', 'build'],
      cwdComparablePath: 'workspace/apps/customer',
      cwdPath: '/workspace/apps/customer',
    }
  );

  assert.equal(
    ranked[0].candidate.workspaceRelativePath,
    'apps/customer/components/booking-overview/upcoming-bookings.tsx'
  );
});

test('builds a quick open fallback query for partially matched relative paths', () => {
  const parsedPath = parsePathMatches('/services/bookings/core/cancel-booking.ts:263:34')[0];

  assert.equal(
    buildQuickOpenQuery(parsedPath),
    'services/bookings/core/cancel-booking.ts:263:34'
  );
});
