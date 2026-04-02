import { QUICK_PICK_THRESHOLD } from './constants';
import { getBasename, getPathSegments, getSuffixes } from './pathUtils';
import type { IndexedWorkspaceFile, ParsedPathMatch, TerminalContextHint } from './types';

export interface RankedCandidate {
  candidate: IndexedWorkspaceFile;
  score: number;
}

function getMatchingSuffixLength(left: string[], right: string[]): number {
  let count = 0;

  while (
    count < left.length &&
    count < right.length &&
    left[left.length - 1 - count] === right[right.length - 1 - count]
  ) {
    count++;
  }

  return count;
}

function getTokenAlignmentScore(candidate: IndexedWorkspaceFile, tokens: string[]): number {
  if (!tokens.length) {
    return 0;
  }

  const candidateTokens = new Set(
    candidate.segments
      .flatMap((segment) => segment.split(/[.@_-]/))
      .map((segment) => segment.toLowerCase())
      .filter(Boolean)
  );

  let score = 0;
  for (const token of tokens) {
    if (candidateTokens.has(token)) {
      score += 25;
    }
  }

  return score;
}

function getTerminalCwdScore(
  candidate: IndexedWorkspaceFile,
  terminalContext: TerminalContextHint | undefined
): number {
  const cwdComparablePath = terminalContext?.cwdComparablePath;
  if (!cwdComparablePath) {
    return 0;
  }

  if (candidate.absoluteComparablePath === cwdComparablePath) {
    return 120;
  }

  if (candidate.absoluteComparablePath.startsWith(`${cwdComparablePath}/`)) {
    return 90;
  }

  return 0;
}

function scoreCandidate(
  candidate: IndexedWorkspaceFile,
  parsedPath: ParsedPathMatch,
  terminalContext?: TerminalContextHint
): number {
  const targetSegments = getPathSegments(parsedPath.normalizedComparablePath);
  const candidateSegments = candidate.segments;
  const suffixLength = getMatchingSuffixLength(candidateSegments, targetSegments);
  if (suffixLength === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = suffixLength * 20;
  const targetComparablePath = parsedPath.normalizedComparablePath;
  const targetBasename = getBasename(targetComparablePath);

  if (candidate.comparablePath === targetComparablePath) {
    score += 1000;
  }

  if (candidate.basename === targetBasename) {
    score += 10;
  }

  if (candidateSegments.length === targetSegments.length) {
    score += 8;
  } else {
    score -= Math.abs(candidateSegments.length - targetSegments.length);
  }

  score += getTokenAlignmentScore(candidate, parsedPath.taskTokens);
  score += getTokenAlignmentScore(candidate, terminalContext?.tokens ?? []) * 2;
  score += getTerminalCwdScore(candidate, terminalContext);

  return score;
}

export function rankCandidates(
  candidates: IndexedWorkspaceFile[],
  parsedPath: ParsedPathMatch,
  terminalContext?: TerminalContextHint
): RankedCandidate[] {
  const comparableSuffixes = new Set(getSuffixes(parsedPath.normalizedComparablePath));

  return candidates
    .filter((candidate) => {
      for (const suffix of comparableSuffixes) {
        if (candidate.comparablePath === suffix || candidate.comparablePath.endsWith(`/${suffix}`)) {
          return true;
        }
      }

      return false;
    })
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, parsedPath, terminalContext) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => right.score - left.score);
}

export function hasClearBestCandidate(candidates: RankedCandidate[]): boolean {
  if (candidates.length <= 1) {
    return candidates.length === 1;
  }

  const [best, secondBest] = candidates;
  if (best.score >= 1000) {
    return true;
  }

  return best.score - secondBest.score >= QUICK_PICK_THRESHOLD;
}
