# Terminal Path Resolver

Resolve terminal file paths to the right file in your workspace, even when the emitted path does not exactly match your local machine.

## What It Supports

Terminal Path Resolver detects and opens:

- Unix absolute paths like `/repo/apps/web/src/page.tsx:12:3`
- Windows absolute paths like `C:\repo\apps\web\src\page.tsx:12:3`
- Workspace-relative paths like `apps/web/src/page.tsx:12:3`
- Task-prefixed relative paths like `web:dev: src/page.tsx:12:3`

It is designed for monorepos and Turborepo-style terminal output where the visible path is often only a suffix of the real file location.

It also handles copied stack traces where a path or `:line:column` suffix has been split across multiple lines.

## How It Resolves Paths

The extension resolves paths in this order:

1. Exact absolute path on the current machine
2. Exact workspace-relative path under any open workspace folder
3. Ranked suffix matches from a cached workspace file index

When more than one file is plausible, the extension shows a Quick Pick instead of silently opening the first match.

## Usage

### Terminal links

Cmd-click on macOS or Ctrl-click on Windows/Linux to open a detected path directly from the integrated terminal.

### Manual command

Select a path in the editor and run `Terminal Path Resolver: Open File Path` from the command palette.

## Settings

- `terminalPathResolver.showQuickPickOnAmbiguousMatch`
  Show a Quick Pick when multiple files are plausible matches.
- `terminalPathResolver.excludeGlob`
  Legacy single-glob exclude appended to the built-in excludes.
- `terminalPathResolver.excludeGlobs`
  Additional glob patterns excluded from the workspace file index. Use this for repo-specific build artifacts.
- `terminalPathResolver.maxIndexedFiles`
  Limit how many files are indexed per workspace folder.
- `terminalPathResolver.extraExtensions`
  Add extra file extensions to the built-in supported list.

## Supported File Types

Built-in extensions:

`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.html`, `.css`, `.scss`, `.sass`, `.less`, `.vue`, `.svelte`, `.astro`, `.json`, `.yaml`, `.yml`, `.toml`, `.xml`, `.env`, `.py`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.php`, `.sql`, `.sh`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.swift`, `.graphql`, `.gql`, `.md`, `.mdx`

## Development

```bash
npm install
npm run compile
npm run test:unit
npm run test:integration
```

Open the repo in VS Code and press `F5` to launch an Extension Development Host.

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=maydotinc.terminal-path-resolver), [OpenVSX](https://open-vsx.org/extension/maydotinc/terminal-path-resolver), or package the repo locally:

```bash
npm run package
code --install-extension builds/terminal-path-resolver-0.0.2.vsix
```

## License

MIT
