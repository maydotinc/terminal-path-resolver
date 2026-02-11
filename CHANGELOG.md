## 1.0.0 - 2026-02-11

### Added

- Terminal link provider that detects file paths in terminal output in the form `/path/to/file.ext:line[:col]` and opens them directly in VS Code.
- Open paths via Cmd-click (macOS) / Ctrl-click (Windows/Linux) on matched terminal links.
- Multi-root workspace support: attempts to resolve “no-match” paths by searching across all workspace folders.
- Monorepo-friendly path resolution:
  - Strips a detected repo root (by markers like `.git`, `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, etc.) to try a relative path.
  - Falls back to trying successive suffixes of the original path within each workspace folder.
- Command `Terminal Path Resolver: Open File Path` (`terminalPathResolver.openPath`) to open a selected path (with terminal prompt artifacts stripped).
- Support for common source/config extensions (JS/TS, web, config, backend/system languages, GraphQL, and markdown) when detecting links.
- User-facing errors when no path is detected or when a path can’t be resolved in the current workspace.
