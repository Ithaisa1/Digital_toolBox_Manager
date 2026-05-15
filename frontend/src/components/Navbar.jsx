import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

const Navbar = ({ theme, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const navLinkClass = ({ isActive }) => `navbar-link${isActive ? ' active' : ''}`;

  return (
    <nav className={`navbar navbar-${theme}`}>
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-mark">TB</span>
          <span className="brand-text">{t('common.appName')}</span>
        </Link>
      </div>
      <div className="navbar-links">
        <NavLink to="/dashboard" className={navLinkClass}>
          {t('nav.dashboard')}
        </NavLink>
        <NavLink to="/tools" className={navLinkClass}>
          {t('nav.tools')}
        </NavLink>
        <NavLink to="/subscriptions" className={navLinkClass}>
          {t('subscriptions.title')}
        </NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `admin-link navbar-link${isActive ? ' active' : ''}`}
          >
            {t('nav.admin')}
          </NavLink>
        )}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <LanguageSelector />
        {user && (
          <>
            <Link
              to="/profile"
              className="navbar-profile-link"
              title={t('nav.profile')}
              aria-label={t('nav.profile')}
            >
              <span className="navbar-profile-avatar" aria-hidden="true">{userInitial}</span>
            </Link>
            <button onClick={logout} className="btn btn-secondary">{t('profile.logout')}</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;