export const SUPPORTED_FILE_EXTENSIONS = [
  // JavaScript & TypeScript
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',

  // Web & Frontend
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'vue',
  'svelte',
  'astro',

  // Data & Configuration
  'json',
  'yaml',
  'yml',
  'toml',
  'xml',
  'env',

  // Backend Languages
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'php',
  'sql',
  'sh',

  // System Languages
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'swift',

  // GraphQL
  'graphql',
  'gql',

  // Documentation & Markdown
  'md',
  'mdx',
] as const;

// Regex to match file paths with line and optional column numbers
export const PATH_REGEX = new RegExp(
  `(\\/[^:\\s]+?\\.(${SUPPORTED_FILE_EXTENSIONS.join('|')})):(\\d+)(?::(\\d+))?` // Example: /path/to/file.ext:line[:col]
);

// Regex to match file paths with line and optional column numbers, global
export const PATH_REGEX_GLOBAL = new RegExp(
  `(\\/[^:\\s]+?\\.(${SUPPORTED_FILE_EXTENSIONS.join('|')})):(\\d+)(?::(\\d+))?`, // Example: /path/to/file.ext:line[:col]
  'g'
);

// Regex to strip terminal artifacts from selections
export const TERMINAL_ARTIFACTS_REGEX = /^[»│\s]+/;
