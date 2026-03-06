import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatRelativeDate } from '../utils/format';
import { PublicTag } from '../components/Tag';
import { GistWithStats } from '@snippet-bin/shared';

export default function Home() {
  const [gists, setGists] = useState<GistWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const { user } = useAuth();

  const userJoined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';
  const userInfoRows = user
    ? [
        { label: 'Username', value: user.username },
        { label: 'Email', value: user.email || '—' },
        { label: 'Member since', value: userJoined },
      ]
    : [];

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

  const totalFiles = gists.reduce((acc, gist) => acc + Object.keys(gist.files).length, 0);
  const publicCount = gists.filter((g) => g.public).length;
  const secretCount = gists.filter((g) => !g.public).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#8b949e]">Gist explorer</p>
          <h1 className="text-3xl font-semibold text-white">Gists</h1>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="section-panel section-panel--tight relative overflow-hidden space-y-5 text-sm text-[#8b949e]">
          <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"></div>
          {user && (
            <div className="relative space-y-4 text-center">
              <div className="flex justify-center">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name || user.username || user.id}`}
                  alt={user.name || user.username || 'User'}
                  className="h-16 w-16 rounded-full border border-white/20"
                />
              </div>
              <div>
                <p className="text-base font-semibold text-white">{user.name || user.username}</p>
                <p className="text-xs text-[#8b949e]">Personal snippets</p>
              </div>

              <hr className="my-4 border-white/20" />

              <div className="text-left text-sm text-[#8b949e] space-y-2">
                {userInfoRows.map((info) => (
                  <div key={info.label} className="flex justify-between">
                    <span className="text-xs uppercase tracking-[0.3em]">{info.label}</span>
                    <span className="text-sm text-white break-words">{info.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="relative space-y-3">
            <hr className="my-4 border-white/20" />

            <div className="flex items-center justify-between">
              <span>Gists</span>
              <span className="font-semibold text-white">{gists.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Files</span>
              <span className="font-semibold text-white">{totalFiles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Public</span>
              <span className="font-semibold text-white">{publicCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Secret</span>
              <span className="font-semibold text-white">{secretCount}</span>
            </div>
          </div>
        </aside>

        <section className="section-panel !p-0 divide-y divide-[#1c2330]">
          {gists.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#8b949e]">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-white font-semibold text-lg mb-2">
                Gists don’t have any content yet
              </p>
              <p className="mb-4">Create a snippet to share your ideas.</p>
              <Link to="/new" className="btn-accent">
                Create a new gist
              </Link>
            </div>
          ) : (
            gists.map((gist, idx) => (
              <GistRow key={gist.id} gist={gist} isLast={idx === gists.length - 1} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function GistRow({ gist, isLast }: { gist: GistWithStats; isLast: boolean }) {
  const files = Object.keys(gist.files);

  return (
    <Link
      to={`/gists/${gist.id}`}
      className={`block p-5 transition ${!isLast ? 'border-b border-[#1c2330]' : ''} hover:bg-[#161b22]`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <PublicTag isPublic={gist.public} />
        <h2 className="text-lg font-semibold text-white truncate max-w-[70%]">
          {gist.description || 'Untitled'}
        </h2>
        {gist.owner?.login && (
          <span className="text-xs text-[#8b949e] flex items-center gap-1">
            <svg className="w-3 h-3 text-[#58a6ff]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-3.33 0-6 1.67-6 3v1h12v-1c0-1.33-2.67-3-6-3z" />
            </svg>
            by <strong>{gist.owner.login}</strong>
          </span>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-[#8b949e]">
          {gist.star_count > 0 && (
            <span className="flex items-center gap-1 text-[#58a6ff]">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {gist.star_count}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8b949e] mt-3">
        <span>Updated {formatRelativeDate(gist.updated_at)}</span>
        <span>
          {files.length} file{files.length === 1 ? '' : 's'}
        </span>
      </div>
    </Link>
  );
}
