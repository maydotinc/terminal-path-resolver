import * as vscode from 'vscode';
import { PATH_REGEX, TERMINAL_ARTIFACTS_REGEX } from './constants';
import { resolvePath, openFile } from './resolver';

export function registerCommands(context: vscode.ExtensionContext): void {
  const openPathCommand = vscode.commands.registerCommand(
    'terminalPathResolver.openPath',
    handleOpenPath
  );

  context.subscriptions.push(openPathCommand);
}

async function handleOpenPath(): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) return;

  const selection = editor.document.getText(editor.selection);

  const cleaned = selection.replace(TERMINAL_ARTIFACTS_REGEX, '');
  const match = cleaned.match(PATH_REGEX);

  if (!match) {
    vscode.window.showErrorMessage('No file path detected.');
    return;
  }

  const [, fullPath, , lineStr, colStr] = match;
  const line = Number(lineStr) - 1;
  const col = colStr ? Number(colStr) - 1 : 0;

  const resolved = await resolvePath(fullPath);
  if (resolved) {
    await openFile(resolved, line, col);
  } else {
    vscode.window.showErrorMessage('Could not resolve path in workspace.');
  }
}
