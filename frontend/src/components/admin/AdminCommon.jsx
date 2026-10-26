/**
 * Piezas comunes del panel: estados de carga/error, insignias y tarjetas de KPI.
 */
import { useTranslation } from 'react-i18next';

export const SectionState = ({ loading, error, onRetry, children }) => {
  const { t } = useTranslation();
  if (error) {
    return (
      <div className="admin-state admin-state-error" role="alert">
        <p>{t('adminPanel.loadError')}</p>
        <button type="button" className="btn btn-secondary" onClick={onRetry}>{t('adminPanel.retry')}</button>
      </div>
    );
  }
  if (loading && !children) {
    return <div className="admin-state" aria-busy="true">{t('adminPanel.loading')}</div>;
  }
  return children;
};

export const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  return (
    <span className={`admin-badge ${role === 'ADMIN' ? 'is-admin' : 'is-user'}`}>
      {role === 'ADMIN' ? t('adminPanel.users.roleAdmin') : t('adminPanel.users.roleUser')}
    </span>
  );
};

export const StatusBadge = ({ blocked }) => {
  const { t } = useTranslation();
  return (
    <span className={`admin-badge ${blocked ? 'is-blocked' : 'is-active'}`}>
      <span aria-hidden="true">{blocked ? '⛔' : '●'}</span> {blocked ? t('adminPanel.users.blocked') : t('adminPanel.users.active')}
    </span>
  );
};

export const KpiCard = ({ label, value, hint }) => (
  <div className="admin-kpi">
    <p className="admin-kpi-label">{label}</p>
    <p className="admin-kpi-value">{value}</p>
    {hint && <p className="admin-kpi-hint">{hint}</p>}
  </div>
);

/** Aviso temporal tras una acción (éxito o error). */
export const Notice = ({ notice, onClose }) => {
  if (!notice) return null;
  return (
    <div className={`admin-notice ${notice.type === 'error' ? 'is-error' : 'is-success'}`} role="status">
      <span>{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="OK">×</button>
    </div>
  );
};
