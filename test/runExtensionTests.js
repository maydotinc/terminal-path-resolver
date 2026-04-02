const path = require('path');
const fs = require('fs');
const { runTests } = require('@vscode/test-electron');

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, '..');
  const extensionTestsPath = path.resolve(__dirname, 'suite', 'index.js');
  const workspacePath = path.resolve(__dirname, 'fixtures', 'workspace');
  const runtimePath = path.resolve(__dirname, '..', '.vscode-test');
  const userDataDir = path.join(runtimePath, 'user-data');
  const extensionsDir = path.join(runtimePath, 'extensions-runtime');

  fs.rmSync(userDataDir, { recursive: true, force: true });
  fs.rmSync(extensionsDir, { recursive: true, force: true });

  try {
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        workspacePath,
        '--disable-extensions',
        '--user-data-dir',
        userDataDir,
        '--extensions-dir',
        extensionsDir,
      ],
    });
  } catch (error) {
    console.error('Failed to run extension tests');
    throw error;
  }
}

main();
