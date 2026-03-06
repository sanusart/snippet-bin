import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import GistView from './pages/GistView';
import GistEdit from './pages/GistEdit';
import NewGist from './pages/NewGist';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/new" element={<PrivateRoute><NewGist /></PrivateRoute>} />
        <Route path="/gists/:id" element={<PrivateRoute><GistView /></PrivateRoute>} />
        <Route path="/gists/:id/edit" element={<PrivateRoute><GistEdit /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </div>
  );
}
