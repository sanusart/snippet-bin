import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Navbar() {
  const { token, logout } = useAuth();

  return (
    <nav className="bg-[#030712] border-b border-[#30363d] shadow-[0_1px_0_rgba(255,255,255,0.05)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-white hover:text-[#58a6ff] transition-all"
          >
            <span className="text-2xl">🗑️ </span>
            <div>
              <p className="font-semibold text-lg leading-none">
                {import.meta.env.VITE_APP_NAME ?? 'Snippet Bin'}
              </p>
              <p className="text-xs tracking-wide text-[#8b949e] uppercase">gist style snippets</p>
            </div>
          </Link>
        </div>

        {token && (
          <div className="flex items-center gap-3">
            <Link
              to="/docs"
              className="text-sm font-medium text-[#8b949e] hover:text-white transition-colors"
            >
              ⓘ Docs
            </Link>
            <Link to="/new">
              <Button variant="accent" size="sm">
                + New gist
              </Button>
            </Link>
            <Link to="/settings/profile">
              <Button variant="ghost" size="sm">
                Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
