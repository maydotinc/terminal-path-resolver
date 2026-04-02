export const DEFAULT_SUPPORTED_FILE_EXTENSIONS = [
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'vue',
  'svelte',
  'astro',
  'json',
  'yaml',
  'yml',
  'toml',
  'xml',
  'env',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'php',
  'sql',
  'sh',
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'swift',
  'graphql',
  'gql',
  'md',
  'mdx',
] as const;

export const DEFAULT_EXCLUDE_GLOBS = [
  '**/{node_modules,.git,.next,.nuxt,.svelte-kit,.turbo,.cache,.pnpm-store}/**',
  '**/{dist,build,out,coverage,tmp,temp}/**',
  '**/{target,vendor,.venv,venv}/**',
];

export const DEFAULT_MAX_INDEXED_FILES = 20000;
export const QUICK_PICK_THRESHOLD = 15;

export const ANSI_ESCAPE_REGEX =
  // Matches CSI and OSC terminal escape sequences while leaving printable text intact.
  /\u001B(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007]*(?:\u0007|\u001B\\))/g;
