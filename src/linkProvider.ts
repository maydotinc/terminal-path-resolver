import * as vscode from 'vscode';
import { PATH_REGEX_GLOBAL } from './constants';
import { resolvePath, openFile, getRelativePath } from './resolver';

interface PathLink extends vscode.TerminalLink {
  filePath: string;
  line: number;
  col: number;
}

export class TerminalPathResolverLinkProvider implements vscode.TerminalLinkProvider<PathLink> {
  provideTerminalLinks(context: vscode.TerminalLinkContext): vscode.ProviderResult<PathLink[]> {
    const links: PathLink[] = [];
    const line = context.line;

    PATH_REGEX_GLOBAL.lastIndex = 0;

    let match;
    while ((match = PATH_REGEX_GLOBAL.exec(line)) !== null) {
      const [fullMatch, filePath, , lineStr, colStr] = match;
      const relativePath = getRelativePath(filePath);
      const displayPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      const suffix = colStr ? `${lineStr}:${colStr}` : `${lineStr}`;

      links.push({
        startIndex: match.index,
        length: fullMatch.length,
        tooltip: `Open ${displayPath}:${suffix}`,
        filePath,
        line: Number(lineStr) - 1,
        col: colStr ? Number(colStr) - 1 : 0,
      });
    }

    return links;
  }

  async handleTerminalLink(link: PathLink): Promise<void> {
    const resolved = await resolvePath(link.filePath);
    if (resolved) {
      await openFile(resolved, link.line, link.col);
    } else {
      const relativePath = getRelativePath(link.filePath);
      vscode.window.showErrorMessage(`Could not resolve path: ${relativePath}`);
    }
  }
}
