import { ANSI_ESCAPE_REGEX, DEFAULT_SUPPORTED_FILE_EXTENSIONS } from './constants';
import {
  getPathKind,
  getTaskTokens,
  normalizeComparablePath,
  normalizeSlashes,
} from './pathUtils';
import type { ParsedPathMatch } from './types';

interface SanitizedText {
  text: string;
  indexMap: number[];
}

function removeAnsiSequences(input: string): SanitizedText {
  const indexMap: number[] = [];
  let sanitized = '';
  let sourceIndex = 0;

  for (const match of input.matchAll(ANSI_ESCAPE_REGEX)) {
    const start = match.index ?? sourceIndex;
    const end = start + match[0].length;

    for (let index = sourceIndex; index < start; index++) {
      sanitized += input[index];
      indexMap.push(index);
    }

    sourceIndex = end;
  }

  for (let index = sourceIndex; index < input.length; index++) {
    sanitized += input[index];
    indexMap.push(index);
  }

  return { text: sanitized, indexMap };
}

function isSoftWrapJoinCandidate(character: string | undefined): boolean {
  return !!character && /[A-Za-z0-9_@#$%+~,./\\:-]/.test(character);
}

function collapseSoftWrappedLines(input: SanitizedText): SanitizedText {
  const indexMap: number[] = [];
  let text = '';

  for (let index = 0; index < input.text.length; index++) {
    const char = input.text[index];
    if (char !== '\n' && char !== '\r') {
      text += char;
      indexMap.push(input.indexMap[index]);
      continue;
    }

    let nextIndex = index + 1;
    if (char === '\r' && input.text[nextIndex] === '\n') {
      nextIndex++;
    }

    while (nextIndex < input.text.length && /[ \t]/.test(input.text[nextIndex])) {
      nextIndex++;
    }

    const previousCharacter = text.at(-1);
    const nextCharacter = input.text[nextIndex];
    if (isSoftWrapJoinCandidate(previousCharacter) && isSoftWrapJoinCandidate(nextCharacter)) {
      index = nextIndex - 1;
      continue;
    }

    text += ' ';
    indexMap.push(input.indexMap[index]);
    index = nextIndex - 1;
  }

  return { text, indexMap };
}

function sanitizeTerminalText(input: string): SanitizedText {
  return collapseSoftWrappedLines(removeAnsiSequences(input));
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createCandidateRegex(extensions: readonly string[]): RegExp {
  const extensionPattern = extensions.map(escapeRegex).join('|');
  const segment = '[A-Za-z0-9_@#$%+~,.-]+';
  const separator = '[\\\\/]';
  const filename = `(?:${segment}\\.(?:${extensionPattern})|\\.(?:${extensionPattern}))`;
  const unixAbsolute = `/(?:${segment}${separator})*${filename}`;
  const windowsAbsolute = `[A-Za-z]:${separator}(?:${segment}${separator})*${filename}`;
  const relative = `(?:\\.{1,2}${separator})?(?:${segment}${separator})*${filename}`;

  return new RegExp(`(?:${windowsAbsolute}|${unixAbsolute}|${relative}):(\\d+)(?::(\\d+))?`, 'g');
}

function isValidBoundary(character: string | undefined): boolean {
  if (!character) {
    return true;
  }

  return /[\s([{'"`]/.test(character);
}

export function parsePathMatches(
  input: string,
  extensions: readonly string[] = DEFAULT_SUPPORTED_FILE_EXTENSIONS
): ParsedPathMatch[] {
  const { text, indexMap } = sanitizeTerminalText(input);
  const candidateRegex = createCandidateRegex(extensions);
  const matches: ParsedPathMatch[] = [];

  for (const match of text.matchAll(candidateRegex)) {
    const rawMatch = match[0];
    const matchIndex = match.index ?? 0;
    const previousCharacter = matchIndex > 0 ? text[matchIndex - 1] : undefined;
    if (!isValidBoundary(previousCharacter)) {
      continue;
    }

    const lineText = match[1];
    const columnText = match[2];
    const suffix = columnText ? `:${lineText}:${columnText}` : `:${lineText}`;
    const originalPath = rawMatch.slice(0, -suffix.length);
    const startIndex = indexMap[matchIndex] ?? matchIndex;
    const lastCharacterIndex = matchIndex + rawMatch.length - 1;
    const endIndex = indexMap[lastCharacterIndex] ?? lastCharacterIndex;
    const taskTokens = getTaskTokens(text.slice(0, matchIndex));

    matches.push({
      rawText: rawMatch,
      originalPath,
      normalizedPath: normalizeSlashes(originalPath),
      normalizedComparablePath: normalizeComparablePath(originalPath),
      line: Number(lineText) - 1,
      col: columnText ? Number(columnText) - 1 : 0,
      startIndex,
      length: endIndex - startIndex + 1,
      pathKind: getPathKind(originalPath),
      taskTokens,
    });
  }

  return matches;
}
