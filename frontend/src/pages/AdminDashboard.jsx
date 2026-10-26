/**
 * Panel de control del administrador.
 * Pestañas: Resumen, Usuarios, Herramientas, Categorías, Actividad y Sistema.
 * La pestaña activa se guarda en la URL (?tab=users) para poder compartirla o recargar.
 */
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminTools from '../components/admin/AdminTools';
import AdminCategories from '../components/admin/AdminCategories';
import AdminActivity from '../components/admin/AdminActivity';
import AdminSystem from '../components/admin/AdminSystem';
import './AdminDashboard.css';

const TABS = [
  { id: 'overview', icon: '📊' },
  { id: 'users', icon: '👥' },
  { id: 'tools', icon: '🧰' },
  { id: 'categories', icon: '🏷️' },
  { id: 'activity', icon: '📜' },
  { id: 'system', icon: '⚙️' },
];

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((item) => item.id === params.get('tab')) ? params.get('tab') : 'overview';
  const go = (id) => setParams(id === 'overview' ? {} : { tab: id });

  return (
    <div className="admin-panel">
      <header className="admin-panel-header">
        <h1>{t('adminPanel.title')}</h1>
        <p>{t('adminPanel.subtitle')}</p>
      </header>

      <nav className="admin-tabs" role="tablist" aria-label={t('adminPanel.title')}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`admin-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls="admin-tabpanel"
            className={`admin-tab ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => go(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span> {t(`adminPanel.tabs.${item.id}`)}
          </button>
        ))}
      </nav>

      <section id="admin-tabpanel" role="tabpanel" aria-labelledby={`admin-tab-${tab}`} className="admin-tabpanel">
        {tab === 'overview' && <AdminOverview onSeeActivity={() => go('activity')} />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'tools' && <AdminTools />}
        {tab === 'categories' && <AdminCategories />}
        {tab === 'activity' && <AdminActivity />}
        {tab === 'system' && <AdminSystem />}
      </section>
    </div>
  );
};

export default AdminDashboard;
