import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../utils/api';
import { GistFile } from '@snippet-bin/shared';
import { LANGUAGES } from '../utils/languages';
import Button from '../components/Button';

export default function NewGist() {
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [files, setFiles] = useState([{ name: '', content: '', language: 'javascript' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const api = useApi();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validFiles = files.filter((f) => f.name.trim());

    if (validFiles.length === 0) {
      setError('At least one file is required');
      return;
    }

    const filesObj: Record<string, GistFile> = {};
    validFiles.forEach((f) => {
      filesObj[f.name] = {
        content: f.content,
        language: f.language,
      };
    });

    setLoading(true);

    try {
      const gist = await api.post('/api/gists', {
        description,
        public: isPublic,
        files: filesObj,
      });

      navigate(`/gists/${gist.id}`);
    } catch {
      setError('Failed to create gist');
    } finally {
      setLoading(false);
    }
  };

  const addFile = () => {
    setFiles([...files, { name: '', content: '', language: 'javascript' }]);
  };

  const updateFile = (index: number, field: string, value: string) => {
    const newFiles = [...files];
    (newFiles[index] as Record<string, string>)[field] = value;
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    if (files.length > 1) {
      setFiles(files.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#8b949e]">Snippet builder</p>
          <h1 className="text-3xl font-semibold text-white">Create new gist</h1>
        </div>
        <p className="text-sm text-[#8b949e]">Share code in seconds with a GitHub-esque view.</p>
      </header>

      <form onSubmit={handleSubmit} className="section-panel space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/60 bg-[#391c1f] px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="description" className="text-xs text-[#8b949e]">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this gist do?"
            className="w-full rounded-2xl border border-[#30363d] bg-[#04070d] px-3 py-2 text-white focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-[#8b949e]">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded-sm border border-[#30363d] bg-transparent text-[#58a6ff] focus:ring-[#58a6ff]"
          />
          Public gist - anyone can view this snippet.
        </label>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Files</span>
            <button
              type="button"
              onClick={addFile}
              className="text-xs font-semibold text-[#58a6ff] transition hover:text-[#9ac0ff]"
            >
              + Add file
            </button>
          </div>

          {files.map((file, index) => (
            <div key={index} className="rounded-2xl border border-[#1f2a38] bg-[#050a12]">
              <div className="flex flex-wrap items-center gap-2 border-b border-[#1f2a38] bg-[#070b13] px-3 py-2">
                <input
                  type="text"
                  value={file.name}
                  onChange={(e) => updateFile(index, 'name', e.target.value)}
                  placeholder="filename.js"
                  className="flex-1 rounded-xl border border-[#212d3d] bg-[#01030a] px-2 py-1 text-sm text-white font-mono focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                />
                <select
                  value={file.language}
                  onChange={(e) => updateFile(index, 'language', e.target.value)}
                  className="rounded-xl border border-[#212d3d] bg-[#01030a] px-2 py-1 text-sm text-white focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-[#01030a] text-white">
                      {lang}
                    </option>
                  ))}
                </select>
                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-full border border-[#212d3d] p-1 text-[#f97066] transition hover:border-white"
                    aria-label="Remove file"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <textarea
                value={file.content}
                onChange={(e) => updateFile(index, 'content', e.target.value)}
                placeholder="Paste your code..."
                rows={12}
                className="w-full rounded-b-2xl border-none bg-[#02050a] px-3 py-3 text-sm text-white font-mono placeholder:text-[#5c6e87] focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="button-row flex flex-wrap gap-3">
          <Button type="submit" variant="accent" disabled={loading}>
            {loading ? 'Creating…' : 'Create gist'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
