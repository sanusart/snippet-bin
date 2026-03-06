export const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'html',
  'css',
  'json',
  'markdown',
  'text',
  'shell',
  'bash',
  'go',
  'rust',
  'java',
  'cpp',
  'c',
  'ruby',
  'php',
  'sql',
  'yaml',
  'xml',
];

export const LANGUAGE_MIME_TYPES: Record<string, string> = {
  javascript: 'application/javascript',
  typescript: 'application/typescript',
  python: 'text/python',
  html: 'text/html',
  css: 'text/css',
  json: 'application/json',
  markdown: 'text/markdown',
  text: 'text/plain',
  shell: 'text/x-sh',
  bash: 'text/x-sh',
  go: 'text/x-go',
  rust: 'text/x-rust',
  java: 'text/x-java',
  cpp: 'text/x-c++src',
  c: 'text/x-csrc',
  ruby: 'text/x-ruby',
  php: 'text/x-php',
  sql: 'text/x-sql',
  yaml: 'text/x-yaml',
  xml: 'text/xml',
};

export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  html: 'html',
  htm: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  txt: 'text',
  sh: 'shell',
  bash: 'bash',
  go: 'go',
  rs: 'rust',
  java: 'java',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  c: 'c',
  h: 'c',
  rb: 'ruby',
  php: 'php',
  sql: 'sql',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
};

export function getMimeType(language: string) {
  return LANGUAGE_MIME_TYPES[language] || 'text/plain';
}

export function getLanguageFromFilename(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return LANGUAGE_EXTENSIONS[ext] || 'text';
}
