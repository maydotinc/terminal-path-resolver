# Terminal Path Resolver

Fix no-match file paths in your terminal error logs.

---

## 🎬 Demo Video

<video src="https://cdn-may.com/terminal-path-resolver/example-video.mp4" width="600" style="border-radius:8px; margin-top:8px;" controls loop muted>
  Sorry, your browser doesn't support embedded videos.  
  [Watch Terminal Path Resolver in action](https://cdn-may.com/terminal-path-resolver/example-video.mp4)
</video>

---

**Example:**

_Before:_  
`/example/pages/api/hello.ts:9:29`

_After:_  
`/Users/you/example/pages/api/hello.ts:9:29`

---

**Open file paths from the terminal**: <kbd>Cmd</kbd>-click (on Mac) or <kbd>Ctrl</kbd>-click (on Windows/Linux) any file path shown in the terminal to open that file in your editor—even if the path doesn’t exist exactly on your system.

**Works in monorepos**: Finds and opens files by searching all folders in your workspace for files that match the name and extension, making it easy to handle paths from CI or different machines.

**Manual path opening**: Select any file path in your editor, then run the "Terminal Path Resolver: Open File Path" command from the command palette to jump directly to the file.

## Use Case

When working in a monorepo or with error logs from CI/Docker, file paths often reference locations that don't correlate to the exact path in which it exists on your local machine:

Terminal Path Resolver intercepts these links and resolves them to your actual workspace location.

## Supported File Types

**JavaScript/TypeScript:** `.ts`, `.js`, `.tsx`, `.jsx`, `.mjs`, `.cjs`

**Web/Frontend:** `.css`, `.scss`, `.sass`, `.less`, `.html`, `.vue`, `.svelte`, `.astro`

**Data/Config:** `.json`, `.yaml`, `.yml`, `.toml`, `.xml`, `.env`

**Backend:** `.py`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.php`, `.sql`, `.sh`

**Systems:** `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.swift`

**Other:** `.graphql`, `.gql`, `.md`, `.mdx`

## Installation

Install from the [VS Code Marketplace](pending-link) or install the `.vsix` file directly:

1. Download the most recent `.vsix` file from `/builds` of this repo
2. Run `code --install-extension terminal-path-resolver-X.X.X.vsix`, replacing `X.X.X` with the version you downloaded.

## Run Locally

To test or contribute to Terminal Path Resolver locally:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Compile the extension**

   ```bash
   npm run compile
   ```

3. **Open in VS Code**
   - Open the extension folder in VS Code.
   - Press <kbd>F5</kbd> to launch a new Extension Development Host window with the extension loaded.

**Tip:** Use `npm run watch` for automatic TypeScript recompilation during development.

## License

MIT

## Notes

shipped out of desperation by [noah](https://github.com/NoahGdev), in collab with [may.inc](https://may.inc)

reach out to [info@may.inc](mailto:info@may.inc) for bugs, questions, or improvments

star the repo if helpful :)!
