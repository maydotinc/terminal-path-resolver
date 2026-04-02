import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { TerminalPathResolverLinkProvider } from './linkProvider';
import { PathResolver } from './resolver';

export function activate(context: vscode.ExtensionContext): void {
  const resolver = new PathResolver();
  const linkProvider = vscode.window.registerTerminalLinkProvider(
    new TerminalPathResolverLinkProvider(resolver)
  );

  context.subscriptions.push(resolver, linkProvider);
  registerCommands(context, resolver);

  void resolver.warmIndex();
}

export function deactivate(): void {}
