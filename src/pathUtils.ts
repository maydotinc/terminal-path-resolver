import * as path from 'path';

export function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, '/');
}

export function isWindowsAbsolutePath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(value);
}

export function isUnixAbsolutePath(value: string): boolean {
  return value.startsWith('/');
}

export function getPathKind(value: string): 'unix-absolute' | 'windows-absolute' | 'relative' {
  if (isWindowsAbsolutePath(value)) {
    return 'windows-absolute';
  }
  if (isUnixAbsolutePath(value)) {
    return 'unix-absolute';
  }
  return 'relative';
}

export function normalizeComparablePath(value: string): string {
  const normalized = normalizeSlashes(value).replace(/^[A-Za-z]:/, '');
  return normalized.replace(/^\/+/, '').replace(/^\.\//, '').replace(/\/+/g, '/');
}

export function getPathSegments(value: string): string[] {
  return normalizeComparablePath(value)
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function getBasename(value: string): string {
  const segments = getPathSegments(value);
  return segments[segments.length - 1] ?? '';
}

export function toPlatformPath(value: string): string {
  return value.split('/').join(path.sep);
}

export function getSuffixes(value: string): string[] {
  const segments = getPathSegments(value);
  const suffixes: string[] = [];

  for (let index = 0; index < segments.length; index++) {
    suffixes.push(segments.slice(index).join('/'));
  }

  return suffixes;
}

export function getTaskTokens(prefix: string): string[] {
  const trimmed = prefix.trimEnd();
  const match = trimmed.match(/([@A-Za-z0-9_./-]+(?::[@A-Za-z0-9_./-]+)+):?\s*$/);
  if (!match) {
    return [];
  }

  return match[1]
    .split(/[:/]/)
    .map((token) => token.replace(/^@/, '').trim().toLowerCase())
    .filter(Boolean);
}

export function tokenizeText(value: string): string[] {
  return value
    .split(/[^@A-Za-z0-9._/-]+/)
    .flatMap((token) => token.split(/[:/]/))
    .map((token) => token.replace(/^@/, '').trim().toLowerCase())
    .filter((token) => token.length >= 2);
}
