import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password, name);
      }
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-[#58a6ff]">Welcome</p>
          <h1 className="text-3xl font-semibold text-white">
            {isLogin ? 'Sign in to Gists' : 'Create your account'}
          </h1>
          <p className="text-sm text-[#8b949e]">
            Access your snippets securely and keep everything in sync.
          </p>
        </div>

        <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#080b14]/95 backdrop-blur px-7 py-8 shadow-[0_35px_60px_rgba(2,12,27,0.65)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-semibold text-[#c9d1d9]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[#1f2a38] bg-[#04070d] px-4 py-2 text-white placeholder:text-[#6b7b92] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition"
                placeholder="you@example.com"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm font-semibold text-[#c9d1d9]">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-[#1f2a38] bg-[#04070d] px-4 py-2 text-white placeholder:text-[#6b7b92] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition"
                    placeholder="Your full name"
                    required={!isLogin}
                    minLength={2}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="username" className="text-sm font-semibold text-[#c9d1d9]">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-[#1f2a38] bg-[#04070d] px-4 py-2 text-white placeholder:text-[#6b7b92] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition"
                    placeholder="e.g., codeuser"
                    required={!isLogin}
                    minLength={3}
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-semibold text-[#c9d1d9]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#1f2a38] bg-[#04070d] px-4 py-2 text-white placeholder:text-[#6b7b92] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#539bf5] to-[#2f81ff] py-2 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#8b949e]">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-white underline-offset-4 decoration-[#58a6ff] hover:text-[#58a6ff]"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
