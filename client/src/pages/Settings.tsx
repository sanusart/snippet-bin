import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Token } from '@snippet-bin/shared';
import Tabs from '../components/Tabs';
import Button from '../components/Button';

const TAB_OPTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'tokens', label: 'Personal access tokens' },
];
const TAB_IDS = TAB_OPTIONS.map((tab) => tab.id);

export default function Settings() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [note, setNote] = useState('');
  const [newToken, setNewToken] = useState<Token | null>(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { tab } = useParams();

  const api = useApi();
  const { user, updateUserProfile } = useAuth();

  useEffect(() => {
    loadTokens();
  }, []);

  useEffect(() => {
    setName(user?.name || '');
    setNameMessage('');
  }, [user]);

  useEffect(() => {
    if (!tab || !TAB_IDS.includes(tab)) {
      navigate('/settings/profile', { replace: true });
      return;
    }

    setActiveTab(tab);
  }, [tab, navigate]);

  const loadTokens = async () => {
    try {
      const data = await api.get('/api/tokens');
      setTokens(data);
    } catch (err) {
      console.error('Failed to load tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const createToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = await api.post('/api/tokens', { note });
      setNewToken(token);
      setNote('');
      loadTokens();
    } catch {
      alert('Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;

    try {
      await api.delete(`/api/tokens/${id}`);
      loadTokens();
    } catch {
      alert('Failed to revoke token');
    }
  };

  const copyToken = () => {
    if (!newToken || !newToken.token) return;
    navigator.clipboard.writeText(newToken.token);
    alert('Token copied to clipboard!');
  };

  const handleNameSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameMessage('Name cannot be empty.');
      return;
    }

    if (trimmedName === user?.name) {
      setNameMessage('Name is already set.');
      return;
    }

    setSavingName(true);
    setNameMessage('');
    try {
      const updated = await api.patch('/api/auth/user', { name: trimmedName });
      updateUserProfile(updated);
      setNameMessage('Name saved.');
    } catch (err) {
      const e = err as Error;
      setNameMessage(e.message || 'Unable to update name.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#8b949e]">
            {activeTab === 'profile' ? 'Profile' : 'Credentials'}
          </p>
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          {user && (
            <>
              <p className="text-sm text-[#58a6ff] mt-0.5">
                Signed in as {user.name || user.username}
              </p>
              {user.email && <p className="text-xs text-[#8b949e] mt-0.5">Email: {user.email}</p>}
            </>
          )}
        </div>
        <p className="text-sm text-[#8b949e]">Manage profile and API access in one place.</p>
      </header>

      <Tabs
        tabs={TAB_OPTIONS}
        value={activeTab}
        onChange={(value) => navigate(`/settings/${value}`)}
      />

      <div className="space-y-6">
        {activeTab === 'profile' && (
          <section className="section-panel space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Profile</h2>
              <p className="text-sm text-[#8b949e] mt-1">
                Name is the only editable field right now, but the rest of your account info is
                displayed for reference.
              </p>
            </div>
            {user ? (
              <form onSubmit={handleNameSave} className="space-y-4">
                <div className="space-y-1">
                  <label
                    htmlFor="displayName"
                    className="text-xs uppercase tracking-[0.3em] text-[#8b949e]"
                  >
                    Display name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-[#30363d] bg-[#04070d] px-3 py-2 text-white focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  />
                  {nameMessage && (
                    <p
                      className={`text-xs ${nameMessage.includes('saved') ? 'text-[#58a6ff]' : 'text-red-400'}`}
                    >
                      {nameMessage}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="accent" disabled={savingName}>
                    {savingName ? 'Saving…' : 'Save name'}
                  </Button>
                  <span className="text-xs text-[#8b949e]">
                    Only name updates are supported for now.
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#1f2a38] bg-[#050a12] p-3 text-sm text-[#8b949e]">
                    <p className="text-xs uppercase tracking-[0.3em]">Username</p>
                    <p className="text-white">{user.username}</p>
                  </div>
                  <div className="rounded-2xl border border-[#1f2a38] bg-[#050a12] p-3 text-sm text-[#8b949e]">
                    <p className="text-xs uppercase tracking-[0.3em]">Email</p>
                    <p className="text-white">{user.email || '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-[#1f2a38] bg-[#050a12] p-3 text-sm text-[#8b949e]">
                    <p className="text-xs uppercase tracking-[0.3em]">Member since</p>
                    <p className="text-white">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
              </form>
            ) : (
              <p className="text-sm text-[#8b949e]">Log in to edit your profile.</p>
            )}
          </section>
        )}

        {activeTab === 'tokens' && (
          <section className="section-panel space-y-4">
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Personal access tokens</h2>
                <p className="text-sm text-[#8b949e] mt-1">
                  Generate API tokens to use with the CLI or scripts.
                </p>
              </div>

              {newToken && (
                <div className="rounded-2xl border border-green-500/60 bg-[#1a2a1f] p-4 text-sm text-green-100">
                  <p className="font-semibold text-green-200 mb-2">
                    Token created! Copy it now — you won’t see it again.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <code className="flex-1 rounded-2xl border border-[#1f2a38] bg-[#040d08] px-3 py-2 text-[#8ff3a3] font-mono">
                      {newToken.token}
                    </code>
                    <Button variant="accent" size="sm" onClick={copyToken} className="px-4 py-2">
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setNewToken(null)}>
                      Done
                    </Button>
                  </div>
                </div>
              )}

              <form onSubmit={createToken} className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note (e.g., 'CI pipeline')"
                    className="flex-1 rounded-2xl border border-[#30363d] bg-[#04070d] px-3 py-2 text-white focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  />
                  <Button type="submit" variant="accent" disabled={creating}>
                    {creating ? 'Creating…' : 'Create token'}
                  </Button>
                </div>
              </form>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : tokens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#1f2a38] bg-[#050a12] p-8 text-center text-sm text-[#8b949e]">
                No tokens yet
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1f2a38] bg-[#050a12] p-4"
                  >
                    <div>
                      <p className="text-white font-semibold">{token.note || 'Unnamed token'}</p>
                      <p className="text-sm text-[#8b949e] font-mono">{token.token}</p>
                      <p className="text-xs text-[#5c6e87] mt-1">
                        Created {new Date(token.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghostRed" size="sm" onClick={() => revokeToken(token.id)}>
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="section-panel mt-4 space-y-2">
              <p className="text-sm text-[#8b949e]">
                Include the token in the `Authorization` header for API requests.
              </p>
              <pre className="m-0 rounded-2xl border border-[#1f2a38] bg-[#050a12] p-4 font-mono text-sm text-[#c9d1d9]">
                curl -H "Authorization: token YOUR_TOKEN" http://localhost:3001/api/gists
              </pre>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
