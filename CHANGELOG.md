## 0.0.2 - 2026-04-01

### Added

- Cross-platform parsing for Unix absolute, Windows absolute, workspace-relative, and Turborepo-style task-prefixed paths.
- Terminal-context-aware ranking that prefers the cwd and command context of the terminal that emitted the log line.
- Quick Pick disambiguation for multi-match results without showing absolute-path detail rows.
- Support for copied stack traces where paths or `:line:column` suffixes wrap across multiple lines.
- Unit coverage for parser and ranking behavior, plus extension-host tests for command execution and terminal link detection.
- Smarter default workspace-index excludes for common monorepo and build-output folders, plus configurable `excludeGlobs`.

### Changed

- Replaced first-hit suffix probing with indexed deterministic resolution and scoring.
- Narrowed activation events and removed packaging flags that were only needed for star activation.
- Bumped the packaged extension version to `0.0.2`.

## 1.0.0 - 2026-02-11

### Added

- Initial terminal link provider for `/path/to/file.ext:line[:col]` terminal output.
- Multi-root workspace resolution and the `terminalPathResolver.openPath` command.
