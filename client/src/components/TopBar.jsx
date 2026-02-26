import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ onSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = (user?.display_name || user?.email || '?')[0].toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(search);
  };

  return (
    <div className="topbar">
      <button className="topbar-menu-btn" title="Menu">☰</button>

      <div className="topbar-logo">
        <span><b>R</b>mail</span>
      </div>

      <div className="topbar-search">
        <form className="search-bar" onSubmit={handleSearch}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <div className="topbar-actions">
        <button className="topbar-icon-btn" title="Help">?</button>
        <button className="topbar-icon-btn" title="Settings" onClick={() => navigate('/settings')}>⚙</button>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button className="avatar-btn" onClick={() => setShowMenu(!showMenu)} title={user?.email}>
            {initial}
          </button>
          {showMenu && (
            <div className="avatar-menu">
              <div className="avatar-menu-header">
                <div className="name">{user?.display_name || 'User'}</div>
                <div className="email">{user?.email}</div>
              </div>
              {user?.is_admin && (
                <button className="avatar-menu-item" onClick={() => { setShowMenu(false); navigate('/admin'); }}>
                  👤 Manage Users
                </button>
              )}
              <button className="avatar-menu-item" onClick={() => { setShowMenu(false); navigate('/settings'); }}>
                ⚙ Settings
              </button>
              <button className="avatar-menu-item" onClick={handleLogout}>
                🚪 Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
