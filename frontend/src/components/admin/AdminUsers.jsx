/**
 * Usuarios: búsqueda, filtros, orden, acciones (rol, bloqueo, borrado) y ficha de detalle.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatEuro } from '../../utils/formatCurrency';
import Pagination from '../Pagination';
import { Notice, RoleBadge, SectionState, StatusBadge } from './AdminCommon';
import { adminErrorMessage, formatDate, useAdminData } from './useAdminData';
import { describeMovement } from '../../utils/movements';

const PAGE_SIZE = 10;

/** Valor que espera 300 ms tras dejar de cambiar (para el buscador). */
const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const UserDetail = ({ userId, onClose }) => {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload } = useAdminData(`/admin/users/${userId}`);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="admin-drawer-overlay" onClick={onClose}>
      <aside className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-user-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="admin-drawer-close" onClick={onClose} aria-label={t('adminPanel.detail.close')}>×</button>
        <SectionState loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <header className="admin-drawer-header">
                <span className="admin-avatar admin-avatar-lg" aria-hidden="true">{data.name.charAt(0).toUpperCase()}</span>
                <div>
                  <h2 id="admin-user-title">{data.name}</h2>
                  <p>{data.email}</p>
                  <div className="admin-badges">
                    <RoleBadge role={data.role} />
                    <StatusBadge blocked={data.isBlocked} />
                    {data.isProtected && <span className="admin-badge is-demo">{t('adminPanel.users.demo')}</span>}
                  </div>
                </div>
              </header>

              <dl className="admin-facts">
                <div><dt>{t('adminPanel.detail.monthlySpend')}</dt><dd>{formatEuro(data.monthlySpend)}</dd></div>
                <div><dt>{t('adminPanel.detail.tools')}</dt><dd>{data.toolsCount}</dd></div>
                <div><dt>{t('adminPanel.detail.subscriptions')}</dt><dd>{data.subscriptionsCount}</dd></div>
                <div><dt>{t('adminPanel.detail.movements')}</dt><dd>{data.movementsCount}</dd></div>
                <div><dt>{t('adminPanel.detail.joined')}</dt><dd>{formatDate(data.createdAt, i18n.language)}</dd></div>
                <div><dt>{t('adminPanel.detail.language')}</dt><dd>{(data.language || 'es').toUpperCase()}</dd></div>
                <div><dt>{t('adminPanel.detail.reminders')}</dt><dd>{data.renewalReminders ? t('adminPanel.detail.yes') : t('adminPanel.detail.no')}</dd></div>
              </dl>

              <h3>{t('adminPanel.detail.subscriptions')}</h3>
              {data.subscriptions.length === 0 ? <p className="admin-muted">{t('adminPanel.detail.noSubscriptions')}</p> : (
                <ul className="admin-list">
                  {data.subscriptions.map((s) => (
                    <li key={s.id}>
                      <span><strong>{s.tool}</strong>{s.plan ? ` · ${s.plan}` : ''}</span>
                      <span className="admin-list-meta">
                        {formatEuro(s.price)} · {t(s.billingCycle === 'yearly' ? 'toolDetail.yearly' : 'toolDetail.monthly')}
                        {s.status === 'ACTIVE'
                          ? ` · ${t('adminPanel.detail.renews', { date: formatDate(s.renewalDate, i18n.language) })}`
                          : ` · ${t(`adminPanel.tools.status.${s.status}`)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <h3>{t('adminPanel.detail.tools')}</h3>
              {data.tools.length === 0 ? <p className="admin-muted">{t('adminPanel.detail.noTools')}</p> : (
                <ul className="admin-chips">
                  {data.tools.map((tool) => <li key={tool.id}>{tool.name}</li>)}
                </ul>
              )}

              <h3>{t('adminPanel.detail.activity')}</h3>
              {data.recentActivity.length === 0 ? <p className="admin-muted">{t('adminPanel.detail.noActivity')}</p> : (
                <ul className="admin-feed">
                  {data.recentActivity.map((item) => (
                    <li key={item.id}>
                      <span className={`admin-type admin-type-${item.type}`}>{t(`adminPanel.activity.types.${item.type}`, item.type)}</span>
                      <span className="admin-feed-text">{describeMovement(t, item.description)}</span>
                      <time className="admin-feed-time">{formatDate(item.createdAt, i18n.language, true)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </SectionState>
      </aside>
    </div>
  );
};

const AdminUsers = () => {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const q = useDebounced(search);

  useEffect(() => setPage(1), [q, role, status, sort]);

  const { data, loading, error, reload } = useAdminData('/admin/users', {
    q: q || undefined, role: role || undefined, status: status || undefined, sort, page, limit: PAGE_SIZE,
  });

  const run = async (user, confirmText, request) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(user.id);
    setNotice(null);
    try {
      await request();
      setNotice({ type: 'success', text: t('adminPanel.users.done') });
      await reload();
    } catch (err) {
      setNotice({ type: 'error', text: adminErrorMessage(t, err) });
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (user) => {
    const isMe = user.id === me?.id;
    const locked = isMe || user.isProtected;
    return (
      <div className="admin-actions">
        <button type="button" className="admin-btn" onClick={() => setDetailId(user.id)}>{t('adminPanel.users.view')}</button>
        {!locked && (
          <>
            <button
              type="button"
              className="admin-btn"
              disabled={busyId === user.id}
              onClick={() => run(
                user,
                t(user.role === 'ADMIN' ? 'adminPanel.users.confirmMakeUser' : 'adminPanel.users.confirmMakeAdmin', { name: user.name }),
                () => api.put(`/admin/users/${user.id}/role`, { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' }),
              )}
            >
              {user.role === 'ADMIN' ? t('adminPanel.users.makeUser') : t('adminPanel.users.makeAdmin')}
            </button>
            <button
              type="button"
              className={`admin-btn ${user.isBlocked ? '' : 'is-warning'}`}
              disabled={busyId === user.id}
              onClick={() => run(
                user,
                user.isBlocked ? null : t('adminPanel.users.confirmBlock', { name: user.name }),
                () => api.put(`/admin/users/${user.id}/block`),
              )}
            >
              {user.isBlocked ? t('adminPanel.users.unblock') : t('adminPanel.users.block')}
            </button>
            <button
              type="button"
              className="admin-btn is-danger"
              disabled={busyId === user.id}
              onClick={() => run(user, t('adminPanel.users.confirmDelete', { name: user.name }), () => api.delete(`/admin/users/${user.id}`))}
            >
              {t('adminPanel.users.delete')}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-input admin-search"
          placeholder={t('adminPanel.users.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('adminPanel.users.search')}
        />
        <select className="admin-input" value={role} onChange={(e) => setRole(e.target.value)} aria-label={t('adminPanel.users.colRole')}>
          <option value="">{t('adminPanel.users.allRoles')}</option>
          <option value="ADMIN">{t('adminPanel.users.roleAdmin')}</option>
          <option value="USER">{t('adminPanel.users.roleUser')}</option>
        </select>
        <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('adminPanel.users.colStatus')}>
          <option value="">{t('adminPanel.users.allStatus')}</option>
          <option value="active">{t('adminPanel.users.statusActive')}</option>
          <option value="blocked">{t('adminPanel.users.statusBlocked')}</option>
        </select>
        <select className="admin-input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="newest">{t('adminPanel.users.sortNewest')}</option>
          <option value="oldest">{t('adminPanel.users.sortOldest')}</option>
          <option value="name">{t('adminPanel.users.sortName')}</option>
          <option value="email">{t('adminPanel.users.sortEmail')}</option>
        </select>
      </div>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <SectionState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            {data.items.length === 0 ? <p className="admin-empty">{t('adminPanel.users.none')}</p> : (
              <div className={`admin-table-wrap ${loading ? 'is-loading' : ''}`}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('adminPanel.users.colUser')}</th>
                      <th scope="col">{t('adminPanel.users.colRole')}</th>
                      <th scope="col" className="num">{t('adminPanel.users.colTools')}</th>
                      <th scope="col" className="num">{t('adminPanel.users.colSubs')}</th>
                      <th scope="col">{t('adminPanel.users.colJoined')}</th>
                      <th scope="col">{t('adminPanel.users.colStatus')}</th>
                      <th scope="col">{t('adminPanel.users.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((user) => (
                      <tr key={user.id}>
                        <td data-label={t('adminPanel.users.colUser')}>
                          <div className="admin-user-cell">
                            <span className="admin-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                            <span>
                              <strong>{user.name}</strong>
                              {user.id === me?.id && <span className="admin-badge is-you">{t('adminPanel.users.you')}</span>}
                              {user.isProtected && <span className="admin-badge is-demo">{t('adminPanel.users.demo')}</span>}
                              <span className="admin-sub">{user.email}</span>
                            </span>
                          </div>
                        </td>
                        <td data-label={t('adminPanel.users.colRole')}><RoleBadge role={user.role} /></td>
                        <td data-label={t('adminPanel.users.colTools')} className="num">{user.toolsCount}</td>
                        <td data-label={t('adminPanel.users.colSubs')} className="num">{user.subscriptionsCount}</td>
                        <td data-label={t('adminPanel.users.colJoined')}>{formatDate(user.createdAt, i18n.language)}</td>
                        <td data-label={t('adminPanel.users.colStatus')}><StatusBadge blocked={user.isBlocked} /></td>
                        <td data-label={t('adminPanel.users.colActions')}>{actionsFor(user)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={PAGE_SIZE} onPageChange={setPage} scrollToTop={false} />
          </>
        )}
      </SectionState>

      {detailId && <UserDetail userId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
};

export default AdminUsers;
