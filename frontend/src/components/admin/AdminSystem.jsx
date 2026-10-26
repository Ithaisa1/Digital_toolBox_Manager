/**
 * Sistema: estado de la base de datos, registros, configuración y versión desplegada.
 */
import { useTranslation } from 'react-i18next';
import { SectionState } from './AdminCommon';
import { formatDate, useAdminData } from './useAdminData';

const Flag = ({ on, onText, offText }) => (
  <span className={`admin-badge ${on ? 'is-active' : 'is-muted'}`}>
    <span aria-hidden="true">{on ? '✓' : '–'}</span> {on ? onText : offText}
  </span>
);

const AdminSystem = () => {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useAdminData('/admin/system');
  const s = (key) => t(`adminPanel.system.${key}`);
  const n = (value) => (value === null || value === undefined ? '—' : new Intl.NumberFormat(i18n.language).format(value));

  return (
    <SectionState loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className="admin-system">
          <div className="admin-card">
            <h2 className="admin-card-title">{s('database')}</h2>
            <dl className="admin-facts">
              <div>
                <dt>{s('database')}</dt>
                <dd>
                  <span className={`admin-badge ${data.database.connected ? 'is-active' : 'is-blocked'}`}>
                    <span aria-hidden="true">{data.database.connected ? '●' : '⛔'}</span> {data.database.connected ? s('connected') : s('disconnected')}
                  </span>
                </dd>
              </div>
              <div><dt>{s('latency')}</dt><dd>{data.database.latencyMs ?? '—'} ms</dd></div>
              <div><dt>{s('lastMigration')}</dt><dd className="admin-mono">{data.database.lastMigration || '—'}</dd></div>
            </dl>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">{s('records')}</h2>
            <dl className="admin-facts">
              {Object.entries(data.records).map(([key, value]) => (
                <div key={key}><dt>{t(`adminPanel.system.recordNames.${key}`)}</dt><dd>{n(value)}</dd></div>
              ))}
            </dl>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">{s('config')}</h2>
            <dl className="admin-facts">
              <div><dt>{s('environment')}</dt><dd>{data.config.environment}</dd></div>
              <div><dt>{s('hosting')}</dt><dd>{data.config.hosting}{data.config.region ? ` · ${data.config.region}` : ''}</dd></div>
              <div><dt>{s('demoMode')}</dt><dd><Flag on={data.config.demoMode} onText={s('on')} offText={s('off')} /></dd></div>
              <div><dt>{s('email')}</dt><dd><Flag on={data.config.emailConfigured} onText={s('configured')} offText={s('notConfigured')} /></dd></div>
              <div><dt>{s('cron')}</dt><dd><Flag on={data.config.cronConfigured} onText={s('configured')} offText={s('notConfigured')} /></dd></div>
              <div><dt>{s('reminderDays')}</dt><dd>{data.config.reminderDays}</dd></div>
            </dl>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title">{s('version')}</h2>
            <dl className="admin-facts">
              <div><dt>{s('commit')}</dt><dd className="admin-mono">{data.version.commit || '—'}</dd></div>
              <div><dt>{s('branch')}</dt><dd className="admin-mono">{data.version.branch || '—'}</dd></div>
              <div><dt>{s('node')}</dt><dd className="admin-mono">{data.version.node}</dd></div>
              <div><dt>{s('serverTime')}</dt><dd>{formatDate(data.serverTime, i18n.language, true)}</dd></div>
            </dl>
            <button type="button" className="btn btn-secondary" onClick={reload}>{s('refresh')}</button>
          </div>
        </div>
      )}
    </SectionState>
  );
};

export default AdminSystem;
