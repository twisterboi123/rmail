import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import Inbox from './pages/Inbox';
import EmailView from './pages/EmailView';
import Compose from './pages/Compose';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /><br />Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner" /><br />Loading…</div>;
  }

  return (
    <>
      {user && <Header />}
      <main className="container" style={{ paddingTop: user ? 24 : 0, paddingBottom: 32 }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/email/:uid" element={<ProtectedRoute><EmailView /></ProtectedRoute>} />
          <Route path="/compose" element={<ProtectedRoute><Compose /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
