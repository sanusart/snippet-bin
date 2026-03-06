const languageStyles: Record<string, { border: string; text: string }> = {
  javascript: { border: 'border-yellow-500', text: 'text-yellow-600' },
  typescript: { border: 'border-blue-500', text: 'text-blue-600' },
  python: { border: 'border-green-500', text: 'text-green-600' },
  html: { border: 'border-orange-500', text: 'text-orange-600' },
  css: { border: 'border-blue-400', text: 'text-blue-500' },
  json: { border: 'border-gray-500', text: 'text-gray-600' },
  markdown: { border: 'border-gray-600', text: 'text-gray-700' },
  text: { border: 'border-gray-400', text: 'text-gray-500' },
  shell: { border: 'border-green-600', text: 'text-green-700' },
  bash: { border: 'border-green-600', text: 'text-green-700' },
  go: { border: 'border-cyan-500', text: 'text-cyan-600' },
  rust: { border: 'border-orange-600', text: 'text-orange-700' },
  java: { border: 'border-red-500', text: 'text-red-600' },
  cpp: { border: 'border-blue-600', text: 'text-blue-700' },
  c: { border: 'border-blue-600', text: 'text-blue-700' },
  ruby: { border: 'border-red-600', text: 'text-red-700' },
  php: { border: 'border-purple-500', text: 'text-purple-600' },
  sql: { border: 'border-orange-400', text: 'text-orange-500' },
  yaml: { border: 'border-purple-400', text: 'text-purple-500' },
  xml: { border: 'border-orange-400', text: 'text-orange-500' },
};

export function LanguageTag({ language }: { language?: string | null }) {
  const styles = languageStyles[language?.toLowerCase() ?? 'text'] || languageStyles.text;

  return (
    <span className={`language-chip ${styles.border} ${styles.text}`}>{language || 'Text'}</span>
  );
}

export function PublicTag({ isPublic }: { isPublic?: boolean }) {
  return (
    <span
      className={`public-pill ${isPublic ? 'border-[#2da44e] text-[#2da44e]' : 'border-[#4b5563] text-[#8b949e]'}`}
    >
      {isPublic ? 'Public' : 'Secret'}
    </span>
  );
}
