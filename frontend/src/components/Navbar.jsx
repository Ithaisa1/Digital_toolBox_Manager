/**
 * Barra de navegación: enlaces según rol, tema, idioma y perfil.
 * Responsive con menú hamburguesa animado.
 */
import { useState, useEffect } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinkClass = ({ isActive }) => `navbar-link${isActive ? ' active' : ''}`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <>
      <nav className={`navbar navbar-${theme}${scrolled ? ' navbar-scrolled' : ''}`}>
        <div className="navbar-brand">
          <Link to="/" className="brand-link" onClick={closeMenu}>
            <span className="brand-mark">TB</span>
            <span className="brand-text">{t('common.appName')}</span>
          </Link>
        </div>

        <button
          className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
          {user ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass} onClick={closeMenu}>
                {t('nav.dashboard')}
              </NavLink>
              <NavLink to="/tools" className={navLinkClass} onClick={closeMenu}>
                {t('nav.tools')}
              </NavLink>
              <NavLink to="/subscriptions" className={navLinkClass} onClick={closeMenu}>
                {t('subscriptions.title')}
              </NavLink>
              {user.role === 'ADMIN' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `admin-link navbar-link${isActive ? ' active' : ''}`}
                  onClick={closeMenu}
                >
                  {t('nav.admin')}
                </NavLink>
              )}
              <Link
                to="/profile"
                className="navbar-profile-link"
                title={t('nav.profile')}
                aria-label={t('nav.profile')}
                onClick={closeMenu}
              >
                <span className="navbar-profile-avatar" aria-hidden="true">{userInitial}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary">{t('profile.logout')}</button>
            </>
          ) : (
            <></>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <LanguageSelector />
        </div>
      </nav>

      {menuOpen && <div className="navbar-overlay" onClick={closeMenu} />}
    </>
  );
};

export default Navbar;
