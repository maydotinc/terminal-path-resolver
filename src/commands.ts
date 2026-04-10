import * as vscode from 'vscode';
import { parsePathMatches } from './parser';
import {
  getSupportedExtensions,
  openQuickOpenFallback,
  openResolvedFile,
  PathResolver,
} from './resolver';

export function registerCommands(
  context: vscode.ExtensionContext,
  resolver: PathResolver
): void {
  const openPathCommand = vscode.commands.registerCommand(
    'terminalPathResolver.openPath',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const selection = editor.document.getText(editor.selection);
      const parsedPath = parsePathMatches(selection, getSupportedExtensions())[0];

      if (!parsedPath) {
        vscode.window.showErrorMessage('No file path detected.');
        return;
      }

      const resolved = await resolver.resolve(parsedPath);
      if (!resolved) {
        await openQuickOpenFallback(parsedPath);
        return;
      }

      await openResolvedFile(resolved, parsedPath.line, parsedPath.col);
    }
  );

  context.subscriptions.push(openPathCommand);
}
