import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ComposeModal from './components/ComposeModal';
import Inbox from './pages/Inbox';
import EmailView from './pages/EmailView';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { getInbox } from './api';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppLayout() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailCount, setEmailCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    getInbox(50)
      .then((emails) => setEmailCount(emails.length))
      .catch(() => {});
  }, []);

  return (
    <div className="app-layout">
      <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="app-body">
        <Sidebar
          onCompose={() => setComposeOpen(true)}
          emailCount={emailCount}
        />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Inbox searchQuery={searchQuery} onCountChange={setEmailCount} />} />
            <Route path="/email/:uid" element={<EmailView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
