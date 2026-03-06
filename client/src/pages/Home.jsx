import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../utils/api';

export default function Home() {
  const [gists, setGists] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    loadGists();
  }, []);

  const loadGists = async () => {
    try {
      const data = await api.get('/api/gists');
      setGists(data);
    } catch (err) {
      console.error('Failed to load gists:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Gists</h1>
        <Link
          to="/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
        >
          New Gist
        </Link>
      </div>

      {gists.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🫧 </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No gists yet</h2>
          <p className="text-gray-500 mb-6">Create your first snippet to get started</p>
          <Link
            to="/new"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
          >
            Create Gist
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {gists.map(gist => (
            <GistCard key={gist.id} gist={gist} />
          ))}
        </div>
      )}
    </div>
  );
}

function GistCard({ gist }) {
  const files = Object.keys(gist.files);
  const firstFile = files[0];
  const fileInfo = gist.files[firstFile];

  return (
    <Link
      to={`/gists/${gist.id}`}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {gist.public ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Public</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Secret</span>
            )}
          </div>

          {gist.description && (
            <p className="text-gray-800 font-medium mb-2 truncate">{gist.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {files.map(file => (
              <span key={file} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-mono">
                {gist.files[file]?.language || 'text'}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right text-sm text-gray-500 shrink-0">
          <div>{new Date(gist.updated_at).toLocaleDateString()}</div>
          {gist.star_count > 0 && (
            <div className="flex items-center gap-1 justify-end mt-1">
              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{gist.star_count}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
