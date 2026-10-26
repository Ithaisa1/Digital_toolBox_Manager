/**
 * Registro de actividad de toda la plataforma, con búsqueda y filtro por tipo.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Pagination from '../Pagination';
import { SectionState } from './AdminCommon';
import { formatDate, useAdminData } from './useAdminData';
import { describeMovement } from '../../utils/movements';

const PAGE_SIZE = 20;
const TYPES = ['CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGE', 'PRICE_CHANGE'];

const AdminActivity = () => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setPage(1), [q, type]);

  const { data, loading, error, reload } = useAdminData('/admin/activity', {
    q: q || undefined, type: type || undefined, page, limit: PAGE_SIZE,
  });

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-input admin-search"
          placeholder={t('adminPanel.activity.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('adminPanel.activity.search')}
        />
        <select className="admin-input" value={type} onChange={(e) => setType(e.target.value)} aria-label={t('adminPanel.activity.colType')}>
          <option value="">{t('adminPanel.activity.allTypes')}</option>
          {TYPES.map((value) => <option key={value} value={value}>{t(`adminPanel.activity.types.${value}`)}</option>)}
        </select>
      </div>

      <SectionState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            {data.items.length === 0 ? <p className="admin-empty">{t('adminPanel.activity.none')}</p> : (
              <div className={`admin-table-wrap ${loading ? 'is-loading' : ''}`}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('adminPanel.activity.colWhen')}</th>
                      <th scope="col">{t('adminPanel.activity.colUser')}</th>
                      <th scope="col">{t('adminPanel.activity.colType')}</th>
                      <th scope="col">{t('adminPanel.activity.colDescription')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td data-label={t('adminPanel.activity.colWhen')} className="nowrap">{formatDate(item.createdAt, i18n.language, true)}</td>
                        <td data-label={t('adminPanel.activity.colUser')}>
                          {item.user?.name}
                          <span className="admin-sub">{item.user?.email}</span>
                        </td>
                        <td data-label={t('adminPanel.activity.colType')}>
                          <span className={`admin-type admin-type-${item.type}`}>{t(`adminPanel.activity.types.${item.type}`, item.type)}</span>
                        </td>
                        <td data-label={t('adminPanel.activity.colDescription')}>{describeMovement(t, item.description)}</td>
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
    </div>
  );
};

export default AdminActivity;
