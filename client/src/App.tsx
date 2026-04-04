import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import GistView from './pages/GistView';
import GistEdit from './pages/GistEdit';
import NewGist from './pages/NewGist';
import Settings from './pages/Settings';
import Docs from './pages/Docs';

import { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 pb-12 pt-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/docs" element={<Docs />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/new"
            element={
              <PrivateRoute>
                <NewGist />
              </PrivateRoute>
            }
          />
          <Route
            path="/gists/:id"
            element={
              <PrivateRoute>
                <GistView />
              </PrivateRoute>
            }
          />
          <Route
            path="/gists/:id/edit"
            element={
              <PrivateRoute>
                <GistEdit />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/:tab?"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
