/**
 * Página de inicio: presentación de la app y acciones según sesión.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="home-container">
      <div className="hero">
        <h1>{t('home.welcome')}</h1>
        <p>{t('home.description')}</p>
        <div className="hero-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-primary">{t('auth.login')}</Link>
              <Link to="/register" className="btn btn-secondary">{t('auth.register')}</Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn btn-primary">{t('nav.dashboard')}</Link>
          )}
        </div>
      </div>
      <div className="features">
        <div className="feature-card">
          <h3>{t('home.feature1.title')}</h3>
          <p>{t('home.feature1.description')}</p>
        </div>
        <div className="feature-card">
          <h3>{t('home.feature2.title')}</h3>
          <p>{t('home.feature2.description')}</p>
        </div>
        <div className="feature-card">
          <h3>{t('home.feature3.title')}</h3>
          <p>{t('home.feature3.description')}</p>
        </div>
        <div className="feature-card">
          <h3>{t('home.feature4.title')}</h3>
          <p>{t('home.feature4.description')}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
