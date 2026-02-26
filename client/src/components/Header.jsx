import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <NavLink to="/" className="header-logo">Rmail</NavLink>
      <nav className="header-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
          Inbox
        </NavLink>
        <NavLink to="/compose" className={({ isActive }) => isActive ? 'active' : ''}>
          Compose
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
          Settings
        </NavLink>
        {user?.is_admin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
            Admin
          </NavLink>
        )}
        <button onClick={handleLogout}>Logout</button>
      </nav>
    </header>
  );
}
