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

export const LANGUAGE_COLORS: Record<string, string> = {
  javascript: 'bg-yellow-500',
  typescript: 'bg-blue-500',
  python: 'bg-green-500',
  html: 'bg-orange-500',
  css: 'bg-blue-400',
  json: 'bg-gray-500',
  markdown: 'bg-gray-700',
  text: 'bg-gray-400',
  shell: 'bg-green-600',
  bash: 'bg-green-600',
  go: 'bg-cyan-500',
  rust: 'bg-orange-600',
  java: 'bg-red-500',
  cpp: 'bg-blue-600',
  c: 'bg-blue-600',
  ruby: 'bg-red-600',
  php: 'bg-purple-500',
  sql: 'bg-orange-400',
  yaml: 'bg-purple-400',
  xml: 'bg-orange-400',
};

export function getLanguageColor(lang?: string | null) {
  return LANGUAGE_COLORS[lang?.toLowerCase() ?? 'text'] || 'bg-gray-400';
}
