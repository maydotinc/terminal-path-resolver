import * as vscode from 'vscode';
import { TerminalPathResolverLinkProvider } from './linkProvider';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext): void {
  const linkProvider = vscode.window.registerTerminalLinkProvider(
    new TerminalPathResolverLinkProvider()
  );
  context.subscriptions.push(linkProvider);

  registerCommands(context);
}

export function deactivate(): void {}
