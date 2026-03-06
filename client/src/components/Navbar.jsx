import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { token, logout } = useAuth();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-gray-900 hover:text-blue-600 transition">
          <span>🗑️ </span>
          <span>Snippet-bin</span>
        </Link>

        {token && (
          <div className="flex items-center gap-4">
            <Link
              to="/new"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
            >
              New Gist
            </Link>
            <Link to="/settings" className="text-gray-600 hover:text-gray-900 text-sm transition">
              Settings
            </Link>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-red-600 text-sm transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
