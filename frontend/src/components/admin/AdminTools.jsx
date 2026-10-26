/**
 * Herramientas de todos los usuarios, con búsqueda por herramienta o dueño y filtros.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../../utils/formatCurrency';
import { categoryLabel, sortCategories } from '../../utils/categories';
import Pagination from '../Pagination';
import { SectionState } from './AdminCommon';
import { formatDate, useAdminData } from './useAdminData';

const PAGE_SIZE = 15;

const AdminTools = () => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setPage(1), [q, categoryId, status]);

  const categories = useAdminData('/categories');
  const { data, loading, error, reload } = useAdminData('/admin/tools', {
    q: q || undefined, categoryId: categoryId || undefined, status: status || undefined, page, limit: PAGE_SIZE,
  });

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-input admin-search"
          placeholder={t('adminPanel.tools.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('adminPanel.tools.search')}
        />
        <select className="admin-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label={t('adminPanel.tools.colCategory')}>
          <option value="">{t('adminPanel.tools.allCategories')}</option>
          <option value="none">{t('adminPanel.tools.noCategory')}</option>
          {sortCategories(categories.data || [], t, i18n.language).map((c) => (
            <option key={c.id} value={c.id}>{categoryLabel(t, c.name)}</option>
          ))}
        </select>
        <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('adminPanel.users.colStatus')}>
          <option value="">{t('adminPanel.tools.allStatus')}</option>
          {['ACTIVE', 'INACTIVE', 'ARCHIVED'].map((s) => <option key={s} value={s}>{t(`adminPanel.tools.status.${s}`)}</option>)}
        </select>
      </div>

      <SectionState loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            {data.items.length === 0 ? <p className="admin-empty">{t('adminPanel.tools.none')}</p> : (
              <div className={`admin-table-wrap ${loading ? 'is-loading' : ''}`}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('adminPanel.tools.colTool')}</th>
                      <th scope="col">{t('adminPanel.tools.colOwner')}</th>
                      <th scope="col">{t('adminPanel.tools.colCategory')}</th>
                      <th scope="col" className="num">{t('adminPanel.tools.colPrice')}</th>
                      <th scope="col" className="num">{t('adminPanel.tools.colSubs')}</th>
                      <th scope="col">{t('adminPanel.users.colStatus')}</th>
                      <th scope="col">{t('adminPanel.tools.colCreated')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((tool) => (
                      <tr key={tool.id}>
                        <td data-label={t('adminPanel.tools.colTool')}>
                          <strong>{tool.name}</strong>
                          <span className="admin-sub">{tool.type}</span>
                        </td>
                        <td data-label={t('adminPanel.tools.colOwner')}>
                          {tool.owner.name}
                          <span className="admin-sub">{tool.owner.email}</span>
                        </td>
                        <td data-label={t('adminPanel.tools.colCategory')}>{categoryLabel(t, tool.category)}</td>
                        <td data-label={t('adminPanel.tools.colPrice')} className="num">
                          {tool.price > 0 ? formatEuro(tool.price) : t('adminPanel.tools.free')}
                        </td>
                        <td data-label={t('adminPanel.tools.colSubs')} className="num">{tool.subscriptionsCount}</td>
                        <td data-label={t('adminPanel.users.colStatus')}>
                          <span className={`admin-badge is-${tool.status.toLowerCase()}`}>{t(`adminPanel.tools.status.${tool.status}`)}</span>
                        </td>
                        <td data-label={t('adminPanel.tools.colCreated')}>{formatDate(tool.createdAt, i18n.language)}</td>
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

export default AdminTools;
