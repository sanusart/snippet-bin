import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { GistWithStats } from '@snippet-bin/shared';
import { PublicTag, LanguageTag } from '../components/Tag';
import Button from '../components/Button';
import { formatFullDateTime } from '../utils/format';

const LANGUAGE_SELECTOR = 'code[class*="language-"]';
const PRE_SELECTOR = 'pre[class*="language-"]';
const HIGHLIGHTER_BG = 'transparent';
const gistHighlighterStyle = {
  ...oneDark,
  [LANGUAGE_SELECTOR]: {
    ...oneDark[LANGUAGE_SELECTOR],
    background: HIGHLIGHTER_BG,
  },
  [PRE_SELECTOR]: {
    ...oneDark[PRE_SELECTOR],
    background: HIGHLIGHTER_BG,
    padding: '0',
    margin: '0',
  },
};

export default function GistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gist, setGist] = useState<GistWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [starring, setStarring] = useState(false);
  const [copiedFile, setCopiedFile] = useState(null);

  const api = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadGist();
  }, [id]);

  const loadGist = async () => {
    try {
      const data = await api.get(`/api/gists/${id}`);
      setGist(data);
    } catch {
      setError('Failed to load gist');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const description = gist?.description ? `"${gist.description}"` : 'this gist';
    if (!confirm(`Are you sure you want to delete ${description}?`)) return;

    setDeleting(true);
    try {
      await api.delete(`/api/gists/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      const e = err as Error;
      alert('Failed to delete gist: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleStar = async () => {
    if (!user || !gist) return;
    setStarring(true);
    try {
      if (gist.starred) {
        await api.delete(`/api/gists/${id}/star`);
        setGist({ ...gist, starred: false, star_count: gist.star_count - 1 });
      } else {
        await api.post(`/api/gists/${id}/star`, {});
        setGist({ ...gist, starred: true, star_count: gist.star_count + 1 });
      }
    } catch (err) {
      console.error('Star error:', err);
    } finally {
      setStarring(false);
    }
  };

  const copyToClipboard = async (text: string, fileKey: string) => {
    await navigator.clipboard.writeText(text);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCopiedFile(fileKey as any);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !gist) {
    return (
      <div className="section-panel px-6 py-10 text-center mx-auto max-w-4xl">
        <p className="text-lg font-semibold text-white mb-2">Gist not found</p>
        <p className="text-sm text-[#8b949e] mb-4">
          The gist may have been deleted or you don’t have access to view it.
        </p>
        <Link to="/" className="btn-ghost mx-auto">
          Return home
        </Link>
      </div>
    );
  }

  const files = Object.keys(gist.files);
  const isOwner = user && gist.owner?.id === user.id;

  return (
    <div className="space-y-6">
      <section className="section-panel section-panel--tight space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <PublicTag isPublic={gist.public} />
              <span>by {gist.owner?.login}</span>
            </div>
            <h1 className="text-3xl font-semibold text-white">{gist.description || 'Untitled'}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-[#8b949e]">
              <span>Created {formatFullDateTime(gist.created_at)}</span>
              <span>Updated {formatFullDateTime(gist.updated_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStar}
                disabled={starring}
                className={gist.starred ? 'border-[#58a6ff] text-[#58a6ff]' : 'text-[#8b949e]'}
              >
                {gist.starred ? 'Unstar' : 'Star'}
              </Button>
            )}
            {gist.star_count > 0 && (
              <span className="text-sm text-[#58a6ff] flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {gist.star_count}
              </span>
            )}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Link to={`/gists/${id}/edit`}>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
                <Button variant="ghostRed" size="sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section-panel section-panel--tight space-y-5">
        {files.map((fileName) => {
          const file = gist.files[fileName];

          return (
            <div key={fileName} className="code-surface">
              <div className="file-header">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-blue-600 text-lg">{'🗎'}</span>
                  <span className="font-mono text-white">{fileName}</span>
                  <LanguageTag language={file.language} />
                </div>
                <button
                  onClick={() => copyToClipboard(file.content, fileName)}
                  className="text-xs font-semibold text-[#58a6ff] hover:text-[#9ac0ff]"
                >
                  {copiedFile === fileName ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="file-body">
                <SyntaxHighlighter
                  language={file.language || 'text'}
                  style={gistHighlighterStyle}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    background: 'transparent',
                    color: '#f6f8fa',
                    fontSize: '0.85rem',
                    padding: '1rem 1.25rem',
                  }}
                >
                  {file.content || ''}
                </SyntaxHighlighter>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
