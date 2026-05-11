import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🧰 {t('common.appName')}</Link>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard">{t('nav.dashboard')}</Link>
        <Link to="/tools">{t('nav.tools')}</Link>
        <Link to="/profile">{t('nav.profile')}</Link>
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="admin-link">{t('nav.admin')}</Link>
        )}
        <ThemeToggle />
        <LanguageSelector />
        {user && (
          <>
            <span className="user-name">{user.name}</span>
            <button onClick={logout} className="btn btn-secondary">{t('nav.logout')}</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
