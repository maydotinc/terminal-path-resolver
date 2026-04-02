const path = require('path');
const { pathToFileURL } = require('url');
const test = require('node:test');
const assert = require('node:assert/strict');
const vscode = require('vscode');

const extensionRoot = path.resolve(__dirname, '..', '..');
const { TerminalPathResolverLinkProvider } = require(path.join(extensionRoot, 'out', 'linkProvider.js'));
const { PathResolver } = require(path.join(extensionRoot, 'out', 'resolver.js'));

async function run() {
  await vscode.extensions.getExtension('maydotinc.terminal-path-resolver')?.activate();

  await test('command resolves wrapped multi-line stack trace selections', async () => {
    const fixtureFile = path.join(
      extensionRoot,
      'test',
      'fixtures',
      'workspace',
      'apps',
      'web',
      'src',
      'page.tsx'
    );

    const document = await vscode.workspace.openTextDocument({
      language: 'text',
      content: 'web:dev: apps/web/src/\n  page.tsx:7:5',
    });
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );

    await vscode.commands.executeCommand('terminalPathResolver.openPath');

    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor, 'expected an active editor after command execution');
    assert.equal(activeEditor.document.uri.fsPath, fixtureFile);
    assert.equal(activeEditor.selection.active.line, 6);
    assert.equal(activeEditor.selection.active.character, 4);
  });

  await test('terminal link provider detects Turbo-style links on terminal lines', async () => {
    const resolver = new PathResolver();
    const provider = new TerminalPathResolverLinkProvider(resolver);

    try {
      const fakeTerminal = { name: 'web:dev' };
      const links = provider.provideTerminalLinks({
        line: 'web:dev: src/page.tsx:12:3',
        terminal: fakeTerminal,
      });

      assert.ok(Array.isArray(links));
      assert.equal(links.length, 1);
      assert.equal(links[0].parsedPath.originalPath, 'src/page.tsx');
      assert.equal(links[0].terminal, fakeTerminal);
    } finally {
      resolver.dispose();
    }
  });
}

module.exports = { run };
