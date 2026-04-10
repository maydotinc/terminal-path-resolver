import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  DEFAULT_EXCLUDE_GLOBS,
  DEFAULT_MAX_INDEXED_FILES,
  DEFAULT_SUPPORTED_FILE_EXTENSIONS,
} from './constants';
import {
  getBasename,
  buildQuickOpenQuery,
  getPathSegments,
  isUnixAbsolutePath,
  isWindowsAbsolutePath,
  normalizeComparablePath,
  normalizeSlashes,
  tokenizeText,
  toPlatformPath,
} from './pathUtils';
import {
  hasClearBestCandidate,
  rankCandidates,
  rankSuggestedCandidates,
} from './resolutionEngine';
import type {
  IndexedWorkspaceFile,
  ParsedPathMatch,
  ResolutionResult,
  TerminalContextHint,
} from './types';

const CONFIG_NAMESPACE = 'terminalPathResolver';

function getExtensionConfiguration() {
  return vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
}

export function getSupportedExtensions(): string[] {
  const config = getExtensionConfiguration();
  const extraExtensions = config.get<string[]>('extraExtensions', []);

  return [...new Set([...DEFAULT_SUPPORTED_FILE_EXTENSIONS, ...extraExtensions])]
    .map((extension) => extension.trim().replace(/^\./, ''))
    .filter(Boolean);
}

function shouldUseQuickPick(): boolean {
  return getExtensionConfiguration().get<boolean>('showQuickPickOnAmbiguousMatch', true);
}

function combineExcludeGlobs(globs: string[]): string {
  const cleaned = [...new Set(globs.map((glob) => glob.trim()).filter(Boolean))];
  if (!cleaned.length) {
    return '';
  }
  if (cleaned.length === 1) {
    return cleaned[0];
  }

  return `{${cleaned.join(',')}}`;
}

function getExcludeGlob(): string {
  const config = getExtensionConfiguration();
  const legacyExcludeGlob = config.get<string>('excludeGlob', '').trim();
  const configuredExcludeGlobs = config.get<string[]>('excludeGlobs', []);

  return combineExcludeGlobs([
    ...DEFAULT_EXCLUDE_GLOBS,
    ...configuredExcludeGlobs,
    legacyExcludeGlob,
  ]);
}

function getMaxIndexedFiles(): number {
  return getExtensionConfiguration().get<number>('maxIndexedFiles', DEFAULT_MAX_INDEXED_FILES);
}

function isSupportedFile(filePath: string, supportedExtensions: string[]): boolean {
  const basename = path.basename(filePath);
  const extension = basename.startsWith('.') && !basename.includes('.', 1)
    ? basename.slice(1)
    : path.extname(basename).replace(/^\./, '');

  return supportedExtensions.includes(extension);
}

function getWorkspaceRelativePath(root: string, filePath: string): string {
  return normalizeSlashes(path.relative(root, filePath));
}

function isExactAbsoluteMatch(originalPath: string): boolean {
  if (isUnixAbsolutePath(originalPath)) {
    return fs.existsSync(originalPath);
  }

  if (isWindowsAbsolutePath(originalPath) && process.platform === 'win32') {
    return fs.existsSync(originalPath);
  }

  return false;
}

export async function openQuickOpenFallback(parsedPath: ParsedPathMatch): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.quickOpen', buildQuickOpenQuery(parsedPath));
}

export class PathResolver implements vscode.Disposable {
  private indexPromise: Promise<IndexedWorkspaceFile[]> | undefined;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly terminalExecutionContext = new Map<vscode.Terminal, TerminalContextHint>();

  constructor() {
    const invalidate = () => {
      this.indexPromise = undefined;
    };

    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(CONFIG_NAMESPACE)) {
          invalidate();
        }
      }),
      vscode.workspace.onDidChangeWorkspaceFolders(invalidate)
    );

    this.disposables.push(
      vscode.window.onDidStartTerminalShellExecution((event) => {
        this.terminalExecutionContext.set(event.terminal, {
          cwdPath: event.execution.cwd?.fsPath ?? event.shellIntegration.cwd?.fsPath,
          cwdComparablePath: event.execution.cwd
            ? normalizeComparablePath(event.execution.cwd.fsPath)
            : event.shellIntegration.cwd
              ? normalizeComparablePath(event.shellIntegration.cwd.fsPath)
              : undefined,
          tokens: tokenizeText(`${event.terminal.name} ${event.execution.commandLine.value}`),
        });
      }),
      vscode.window.onDidCloseTerminal((terminal) => {
        this.terminalExecutionContext.delete(terminal);
      })
    );

    const watchers = [vscode.workspace.createFileSystemWatcher('**/*')];

    for (const watcher of watchers) {
      watcher.onDidCreate(invalidate, this, this.disposables);
      watcher.onDidDelete(invalidate, this, this.disposables);
      watcher.onDidChange(invalidate, this, this.disposables);
      this.disposables.push(watcher);
    }
  }

  async resolve(
    parsedPath: ParsedPathMatch,
    terminal?: vscode.Terminal
  ): Promise<ResolutionResult | null> {
    if (isExactAbsoluteMatch(parsedPath.originalPath)) {
      return {
        path: parsedPath.originalPath,
        displayPath: parsedPath.originalPath,
        matchedBy: 'absolute',
      };
    }

    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    if (!workspaceFolders.length) {
      return null;
    }

    const comparablePath = parsedPath.normalizedComparablePath;
    for (const folder of workspaceFolders) {
      const absolutePath = path.join(folder.uri.fsPath, toPlatformPath(comparablePath));
      if (fs.existsSync(absolutePath)) {
        return {
          path: absolutePath,
          displayPath: normalizeSlashes(path.relative(folder.uri.fsPath, absolutePath)),
          matchedBy: 'workspace-relative',
        };
      }
    }

    const index = await this.getIndex();
    const terminalContext = this.getTerminalContext(terminal);
    const rankedCandidates = rankCandidates(index, parsedPath, terminalContext);
    if (!rankedCandidates.length) {
      const suggestedCandidates = rankSuggestedCandidates(index, parsedPath, terminalContext);
      if (!suggestedCandidates.length) {
        return null;
      }

      const pickedSuggestion = await this.pickCandidate(
        suggestedCandidates,
        `No exact match for ${normalizeSlashes(parsedPath.originalPath)}. Select a suggested file.`
      );
      if (!pickedSuggestion) {
        return null;
      }

      return {
        path: pickedSuggestion.fsPath,
        displayPath: pickedSuggestion.workspaceRelativePath,
        matchedBy: 'suggested',
      };
    }

    if (hasClearBestCandidate(rankedCandidates) || !shouldUseQuickPick()) {
      const bestCandidate = rankedCandidates[0].candidate;
      return {
        path: bestCandidate.fsPath,
        displayPath: bestCandidate.workspaceRelativePath,
        matchedBy: 'scored',
      };
    }

    const picked = await this.pickCandidate(
      rankedCandidates,
      `Select a match for ${normalizeSlashes(parsedPath.originalPath)}`
    );
    if (!picked) {
      return null;
    }

    return {
      path: picked.fsPath,
      displayPath: picked.workspaceRelativePath,
      matchedBy: 'scored',
    };
  }

  async warmIndex(): Promise<void> {
    await this.getIndex();
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private async getIndex(): Promise<IndexedWorkspaceFile[]> {
    if (!this.indexPromise) {
      this.indexPromise = this.buildIndex();
    }

    return this.indexPromise;
  }

  private async buildIndex(): Promise<IndexedWorkspaceFile[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    if (!workspaceFolders.length) {
      return [];
    }

    const supportedExtensions = getSupportedExtensions();
    const seen = new Set<string>();
    const indexedFiles: IndexedWorkspaceFile[] = [];

    for (const folder of workspaceFolders) {
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, '**/*'),
        getExcludeGlob(),
        getMaxIndexedFiles()
      );
      const dotFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, '**/.*'),
        getExcludeGlob(),
        getMaxIndexedFiles()
      );

      for (const file of [...files, ...dotFiles]) {
        const fsPath = file.fsPath;
        if (seen.has(fsPath) || !isSupportedFile(fsPath, supportedExtensions)) {
          continue;
        }

        seen.add(fsPath);
        const workspaceRelativePath = getWorkspaceRelativePath(folder.uri.fsPath, fsPath);
        indexedFiles.push({
          fsPath,
          absoluteComparablePath: normalizeComparablePath(fsPath),
          workspaceFolderName: folder.name,
          workspaceFolderPath: folder.uri.fsPath,
          workspaceRelativePath,
          normalizedWorkspaceRelativePath: normalizeSlashes(workspaceRelativePath),
          comparablePath: normalizeComparablePath(workspaceRelativePath),
          basename: getBasename(workspaceRelativePath),
          segments: getPathSegments(workspaceRelativePath),
        });
      }
    }

    return indexedFiles;
  }

  private getTerminalContext(terminal: vscode.Terminal | undefined): TerminalContextHint | undefined {
    if (!terminal) {
      return undefined;
    }

    const shellCwd = terminal.shellIntegration?.cwd?.fsPath;
    const shellContext: TerminalContextHint = {
      cwdPath: shellCwd,
      cwdComparablePath: shellCwd ? normalizeComparablePath(shellCwd) : undefined,
      tokens: tokenizeText(terminal.name),
    };

    const executionContext = this.terminalExecutionContext.get(terminal);
    if (!executionContext) {
      return shellContext;
    }

    return {
      cwdPath: shellContext.cwdPath ?? executionContext.cwdPath,
      cwdComparablePath: shellContext.cwdComparablePath ?? executionContext.cwdComparablePath,
      tokens: [...new Set([...shellContext.tokens, ...executionContext.tokens])],
    };
  }

  private async pickCandidate(
    rankedCandidates: { candidate: IndexedWorkspaceFile }[],
    placeHolder: string
  ): Promise<IndexedWorkspaceFile | undefined> {
    const picked = await vscode.window.showQuickPick(
      rankedCandidates.map(({ candidate }) => ({
        label: candidate.workspaceRelativePath,
        description: candidate.workspaceFolderName,
        candidate,
      })),
      { placeHolder }
    );

    return picked?.candidate;
  }
}

export async function openResolvedFile(result: ResolutionResult, line: number, col: number): Promise<void> {
  const uri = vscode.Uri.file(result.path);
  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc);
  const pos = new vscode.Position(line, col);

  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(new vscode.Range(pos, pos));
}
