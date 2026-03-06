import { useState, useEffect } from 'react';
import { useApi } from '../utils/api';

export default function Settings() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [note, setNote] = useState('');
  const [newToken, setNewToken] = useState(null);
  
  const api = useApi();
  
  useEffect(() => {
    loadTokens();
  }, []);
  
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
  
  const createToken = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const token = await api.post('/api/tokens', { note });
      setNewToken(token);
      setNote('');
      loadTokens();
    } catch (err) {
      alert('Failed to create token');
    } finally {
      setCreating(false);
    }
  };
  
  const revokeToken = async (id) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;
    
    try {
      await api.delete(`/api/tokens/${id}`);
      loadTokens();
    } catch (err) {
      alert('Failed to revoke token');
    }
  };
  
  const copyToken = () => {
    navigator.clipboard.writeText(newToken.token);
    alert('Token copied to clipboard!');
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">API Tokens</h2>
        <p className="text-gray-600 text-sm mb-4">
          Create API tokens to access your gists from the command line or external applications.
        </p>
        
        {newToken && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm mb-2 font-medium">Token created! Copy it now - you won't see it again.</p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-green-200 rounded text-green-600 font-mono text-sm">
                {newToken.token}
              </code>
              <button
                onClick={copyToken}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition"
              >
                Copy
              </button>
              <button
                onClick={() => setNewToken(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={createToken} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (e.g., 'GitHub Actions')"
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
            >
              {creating ? 'Creating...' : 'Create token'}
            </button>
          </div>
        </form>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : tokens.length === 0 ? (
          <p className="text-gray-500 text-sm">No tokens yet</p>
        ) : (
          <div className="space-y-2">
            {tokens.map(token => (
              <div key={token.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div>
                  <p className="text-gray-800 font-medium">{token.note || 'Unnamed token'}</p>
                  <p className="text-sm text-gray-500 font-mono">{token.token}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(token.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => revokeToken(token.id)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 text-sm rounded transition"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Usage</h2>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-sm mb-3">
            Use your API token to authenticate requests:
          </p>
          <pre className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 text-sm font-mono overflow-x-auto">
{`curl -H "Authorization: token YOUR_TOKEN" http://localhost:3001/api/gists`}
          </pre>
        </div>
      </section>
    </div>
  );
}
