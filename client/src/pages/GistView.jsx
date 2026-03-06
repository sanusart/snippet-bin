import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function GistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gist, setGist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFile, setActiveFile] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [starring, setStarring] = useState(false);
  
  const api = useApi();
  const { user } = useAuth();
  
  useEffect(() => {
    loadGist();
  }, [id]);
  
  const loadGist = async () => {
    try {
      const data = await api.get(`/api/gists/${id}`);
      setGist(data);
      const files = Object.keys(data.files);
      if (files.length > 0) setActiveFile(files[0]);
    } catch (err) {
      setError('Failed to load gist');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this gist?')) return;
    
    setDeleting(true);
    try {
      await api.delete(`/api/gists/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete gist: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };
  
  const handleStar = async () => {
    if (!user) return;
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
  
  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !gist) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Gist not found</h2>
        <Link to="/" className="text-blue-600 hover:text-blue-700">Go back home</Link>
      </div>
    );
  }
  
  const files = Object.keys(gist.files);
  const currentFile = activeFile ? gist.files[activeFile] : null;
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {gist.public ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Public</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Secret</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {gist.description || 'Untitled'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">
              Created {new Date(gist.created_at).toLocaleString()} • Updated {new Date(gist.updated_at).toLocaleString()}
            </p>
            {user && (
              <button
                onClick={handleStar}
                disabled={starring}
                className={`flex items-center gap-1 text-sm transition ${gist.starred ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
              >
                <svg className="w-4 h-4" fill={gist.starred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>{gist.star_count || 0}</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link
            to={`/gists/${id}/edit`}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-md transition"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-md transition disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      
      <div className="flex gap-6">
        <div className="w-48 shrink-0">
          <div className="space-y-1">
            {files.map(file => (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={`w-full text-left px-3 py-2 rounded text-sm font-mono truncate transition ${
                  activeFile === file
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {file}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {currentFile && (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => copyToClipboard(currentFile.content)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded transition"
                >
                  Copy
                </button>
              </div>
              <SyntaxHighlighter
                language={currentFile.language || 'text'}
                style={oneLight}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  background: '#f6f8fa',
                  fontSize: '14px'
                }}
              >
                {currentFile.content || ''}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
