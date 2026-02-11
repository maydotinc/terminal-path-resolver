import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const REPO_MARKERS = [
  '.git',
  'package.json',
  'Cargo.toml',
  'go.mod',
  'pyproject.toml',
  'setup.py',
  'pom.xml',
  'build.gradle',
  '.hg',
  '.svn',
];

function findRepoRoot(filePath: string): string | null {
  const parts = filePath.split(path.sep);
  for (let i = parts.length - 1; i >= 0; i--) {
    const dir = parts.slice(0, i + 1).join(path.sep);
    if (!dir) continue;

    for (const marker of REPO_MARKERS) {
      const markerPath = path.join(dir, marker);
      if (fs.existsSync(markerPath)) {
        return dir;
      }
    }
  }

  return null;
}

export function getRelativePath(filePath: string): string {
  const repoRoot = findRepoRoot(filePath);
  if (repoRoot && filePath.startsWith(repoRoot)) {
    return filePath.slice(repoRoot.length + 1);
  }
  return filePath;
}

export async function resolvePath(filePath: string): Promise<string | null> {
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return null;
  }
  const relativePath = getRelativePath(filePath);
  const pathsToTry = [relativePath];

  const parts = filePath.split(path.sep);
  for (let i = 1; i < parts.length; i++) {
    const suffix = parts.slice(i).join(path.sep);
    if (suffix && !pathsToTry.includes(suffix)) {
      pathsToTry.push(suffix);
    }
  }

  for (const folder of workspaceFolders) {
    const root = folder.uri.fsPath;

    for (const tryPath of pathsToTry) {
      const candidate = path.join(root, tryPath);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

export async function openFile(filePath: string, line: number, col: number): Promise<void> {
  const uri = vscode.Uri.file(filePath);
  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc);

  const pos = new vscode.Position(line, col);
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(new vscode.Range(pos, pos));
}
