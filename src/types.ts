export interface ParsedPathMatch {
  rawText: string;
  originalPath: string;
  normalizedPath: string;
  normalizedComparablePath: string;
  line: number;
  col: number;
  startIndex: number;
  length: number;
  pathKind: 'unix-absolute' | 'windows-absolute' | 'relative';
  taskTokens: string[];
}

export interface IndexedWorkspaceFile {
  fsPath: string;
  absoluteComparablePath: string;
  workspaceFolderName: string;
  workspaceFolderPath: string;
  workspaceRelativePath: string;
  normalizedWorkspaceRelativePath: string;
  comparablePath: string;
  basename: string;
  segments: string[];
}

export interface ResolutionResult {
  path: string;
  displayPath: string;
  matchedBy: 'absolute' | 'workspace-relative' | 'scored' | 'suggested';
}

export interface TerminalContextHint {
  cwdComparablePath?: string;
  cwdPath?: string;
  tokens: string[];
}
