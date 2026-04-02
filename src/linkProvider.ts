import * as vscode from 'vscode';
import { parsePathMatches } from './parser';
import { getSupportedExtensions, openResolvedFile, PathResolver } from './resolver';
import type { ParsedPathMatch } from './types';

interface PathLink extends vscode.TerminalLink {
  parsedPath: ParsedPathMatch;
  terminal: vscode.Terminal;
}

export class TerminalPathResolverLinkProvider implements vscode.TerminalLinkProvider<PathLink> {
  constructor(private readonly resolver: PathResolver) {}

  provideTerminalLinks(context: vscode.TerminalLinkContext): vscode.ProviderResult<PathLink[]> {
    return parsePathMatches(context.line, getSupportedExtensions()).map((parsedPath) => ({
      startIndex: parsedPath.startIndex,
      length: parsedPath.length,
      tooltip: `Open ${parsedPath.normalizedPath}:${parsedPath.line + 1}:${parsedPath.col + 1}`,
      parsedPath,
      terminal: context.terminal,
    }));
  }

  async handleTerminalLink(link: PathLink): Promise<void> {
    const resolved = await this.resolver.resolve(link.parsedPath, link.terminal);
    if (!resolved) {
      vscode.window.showErrorMessage(`Could not resolve path: ${link.parsedPath.originalPath}`);
      return;
    }

    await openResolvedFile(resolved, link.parsedPath.line, link.parsedPath.col);
  }
}
