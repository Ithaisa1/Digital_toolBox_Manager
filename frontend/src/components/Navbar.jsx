import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🧰 Digital Toolbox</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/tools">Tools</Link>
            <Link to="/profile">Profile</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="admin-link">Admin</Link>
            )}
            <span className="user-name">{user.name}</span>
            <ThemeToggle />
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <ThemeToggle />
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
