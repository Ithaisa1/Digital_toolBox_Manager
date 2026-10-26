/**
 * Paginación reutilizable: "Mostrando 13–24 de 40" + botones de página.
 * Para paginar una lista en memoria, usar con hooks/usePagination.
 */
import { useTranslation } from 'react-i18next';
import './Pagination.css';

/** Números de página a mostrar, con "…" para los huecos: 1 … 4 5 6 … 10 */
const getPageNumbers = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(`gap-${p}`);
    result.push(p);
  });
  return result;
};

const Pagination = ({ page, totalPages, total, pageSize, onPageChange, scrollToTop = true }) => {
  const { t } = useTranslation();

  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const goTo = (target) => {
    if (target < 1 || target > totalPages || target === page) return;
    onPageChange(target);
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="pagination" aria-label={t('pagination.label')}>
      <p className="pagination-summary">{t('pagination.showing', { from, to, total })}</p>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            aria-label={t('pagination.previous')}
          >
            ‹
          </button>

          {getPageNumbers(page, totalPages).map((item) =>
            typeof item === 'string' ? (
              <span key={item} className="pagination-gap" aria-hidden="true">…</span>
            ) : (
              <button
                key={item}
                type="button"
                className={`pagination-btn ${item === page ? 'is-current' : ''}`}
                onClick={() => goTo(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={t('pagination.page', { page: item })}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className="pagination-btn"
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            aria-label={t('pagination.next')}
          >
            ›
          </button>
        </div>
      )}
    </nav>
  );
};

export default Pagination;
