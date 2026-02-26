import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onCompose, emailCount }) {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <button className="compose-btn" onClick={onCompose}>
        <span className="compose-icon">✏️</span>
        <span>Compose</span>
      </button>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`} end>
          <span className="icon">📥</span>
          <span>Inbox</span>
          {emailCount > 0 && <span className="badge">{emailCount}</span>}
        </NavLink>

        <button className="sidebar-item" style={{ opacity: 0.5, cursor: 'default' }}>
          <span className="icon">⭐</span>
          <span>Starred</span>
        </button>

        <button className="sidebar-item" style={{ opacity: 0.5, cursor: 'default' }}>
          <span className="icon">⏰</span>
          <span>Snoozed</span>
        </button>

        <button className="sidebar-item" style={{ opacity: 0.5, cursor: 'default' }}>
          <span className="icon">📤</span>
          <span>Sent</span>
        </button>

        <button className="sidebar-item" style={{ opacity: 0.5, cursor: 'default' }}>
          <span className="icon">📝</span>
          <span>Drafts</span>
        </button>

        <div className="sidebar-divider" />

        <NavLink to="/settings" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
          <span className="icon">⚙</span>
          <span>Settings</span>
        </NavLink>

        {user?.is_admin && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <span className="icon">👤</span>
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
