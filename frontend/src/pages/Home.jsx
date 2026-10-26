/**
 * Portada: presentación del producto con vista previa y funciones.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../hooks/useMeta';
import { LogoMark } from '../components/Logo';
import './Home.css';

const FEATURES = [
  { key: 'tools', icon: '🧰' },
  { key: 'reminders', icon: '🔔' },
  { key: 'charts', icon: '📈' },
  { key: 'csv', icon: '⇅' },
  { key: 'pwa', icon: '📲' },
  { key: 'admin', icon: '🛡️' },
];

/** Ventana de ejemplo de la app (decorativa). */
const ProductPreview = () => {
  const { t } = useTranslation();
  const bars = [30, 52, 74, 50, 58, 48, 48, 70, 48, 48, 52, 49];
  const rows = [
    ['Figma', t('landing.preview.in3'), '15 €', true],
    ['ChatGPT', t('landing.preview.in5'), '23 €', false],
    ['Notion', t('landing.preview.in14'), '10 €', false],
  ];
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-bar">
        <span /><span /><span />
        <em>dexa-manager.vercel.app</em>
      </div>
      <div className="preview-body">
        <div className="preview-card preview-hero">
          <small>{t('dashboard.bento.monthlySpend')}</small>
          <strong>199,50 €</strong>
          <div className="preview-bars">
            {bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
          </div>
        </div>
        <div className="preview-card preview-list">
          <small>{t('dashboard.upcomingRenewals')}</small>
          {rows.map(([name, when, price, soon]) => (
            <div key={name} className="preview-row">
              <b>{name}</b>
              <span className={soon ? 'soon' : ''}>{when}</span>
              <span>{price}</span>
            </div>
          ))}
        </div>
        <div className="preview-card preview-mini"><small>{t('dashboard.totalTools')}</small><strong>16</strong></div>
        <div className="preview-card preview-mini"><small>{t('dashboard.categories')}</small><strong>11</strong></div>
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const { demo } = useMeta();
  const { t } = useTranslation();

  return (
    <div className="landing">
      <section className="landing-hero">
        <span className="landing-pill">
          <span className="landing-pill-dot" /> {t('landing.pill')}
        </span>
        <h1>
          {t('landing.title1')} <span className="text-aurora">{t('landing.title2')}</span>
        </h1>
        <p className="landing-lead">{t('landing.lead')}</p>
        <div className="landing-ctas">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">{t('landing.goDashboard')} →</Link>
          ) : demo ? (
            <>
              <Link to="/login" className="btn btn-primary btn-lg">{t('landing.tryDemo')} →</Link>
              <a href="https://github.com/Ithaisa1/dexa-manager" className="btn btn-secondary btn-lg" target="_blank" rel="noreferrer">
                {t('landing.code')}
              </a>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">{t('landing.start')} →</Link>
              <Link to="/login" className="btn btn-secondary btn-lg">{t('auth.login')}</Link>
            </>
          )}
        </div>
        <ul className="landing-facts">
          <li>{t('landing.fact1')}</li>
          <li>{t('landing.fact2')}</li>
          <li>{t('landing.fact3')}</li>
        </ul>
        <ProductPreview />
      </section>

      <section className="landing-features" aria-labelledby="features-title">
        <h2 id="features-title">{t('landing.featuresTitle')}</h2>
        <p className="landing-sub">{t('landing.featuresLead')}</p>
        <div className="feature-bento">
          {FEATURES.map(({ key, icon }, i) => (
            <article key={key} className={`feature-tile ${[0, 3, 5].includes(i) ? 'is-wide' : ''}`}>
              <span className="feature-icon" aria-hidden="true">{icon}</span>
              <h3>{t(`landing.features.${key}.title`)}</h3>
              <p>{t(`landing.features.${key}.text`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <LogoMark size={56} />
        <h2>{t('landing.ctaTitle')}</h2>
        <p>{t('landing.ctaText')}</p>
        <Link to={user ? '/dashboard' : demo ? '/login' : '/register'} className="btn btn-primary btn-lg">
          {user ? t('landing.goDashboard') : demo ? t('landing.tryDemo') : t('landing.start')} →
        </Link>
      </section>

      <footer className="landing-footer">
        <span>Dexa Manager · {t('landing.footer')}</span>
        <a href="https://github.com/Ithaisa1/dexa-manager" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </div>
  );
};

export default Home;
