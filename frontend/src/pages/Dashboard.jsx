/**
 * Panel del usuario: estadísticas de herramientas, suscripciones y costes.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import API_URL from '../config/api';
import { categoryColor, categoryLabel } from '../utils/categories';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { formatEuro } from '../utils/formatCurrency';
import { CostByCategoryChart, UpcomingPaymentsChart } from '../components/DashboardCharts';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();

  const dashboardSubtitle = t('dashboard.subtitle');
  const viewAllSubscriptionsLabel = t('dashboard.viewAllSubscriptions');
  const viewToolsLabel = t('dashboard.viewTools');

  useEffect(() => {
    fetchStats();
  }, []);

  /** Obtiene métricas agregadas del endpoint de dashboard. */
  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      setError(t('dashboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format, include) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ format, include });
      const url = `${API_URL}/api/export/data?${params}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || '';
      const ext = contentType.includes('pdf') ? 'pdf' : contentType.includes('json') ? 'json' : 'csv';
      downloadBlob(blob, `dexa-${getToday()}.${ext}`);
      setShowExportModal(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert(t('export.error') || 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getToday = () => new Date().toISOString().split('T')[0];

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div className="error">{t('dashboard.noData')}</div>;

  // Próximas renovaciones (todas las suscripciones activas, ordenadas por fecha)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = (date) => Math.round((new Date(date).setHours(0, 0, 0, 0) - today) / 86400000);
  const upcoming = (stats.subscriptions.byTool || [])
    .flatMap((group) => group.subscriptions.map((sub) => ({ ...sub, toolName: group.toolName, toolId: group.toolId })))
    .filter((sub) => daysUntil(sub.renewalDate) >= 0)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 4);
  const whenLabel = (date) => {
    const days = daysUntil(date);
    if (days === 0) return t('dashboard.bento.today');
    if (days === 1) return t('dashboard.bento.tomorrow');
    return t('dashboard.bento.inDays', { count: days });
  };
  const sparkline = (stats.charts?.upcomingPayments || []).map((m) => m.amount);
  const sparkMax = Math.max(...sparkline, 1);
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div className="dashboard-container dash">
      <header className="dash-header">
        <div>
          <p className="dash-eyebrow">{firstName ? t('dashboard.bento.hello', { name: firstName }) : t('dashboard.title')}</p>
          <h1 className="dash-title">{t('dashboard.bento.title')}</h1>
          <p className="dash-subtitle">{dashboardSubtitle}</p>
        </div>
        <div className="dash-actions">
          <Link to="/tools" className="btn btn-secondary">{viewToolsLabel}</Link>
          <button className="btn btn-primary btn-export" onClick={() => setShowExportModal(true)} aria-label={t('export.title')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {t('export.title')}
          </button>
        </div>
      </header>

      <section className="bento" aria-label={t('dashboard.title')}>
        <Link to="/subscriptions" className="bento-card bento-hero">
          <span className="bento-label">{t('dashboard.bento.monthlySpend')}</span>
          <span className="bento-big">{formatEuro(stats.subscriptions.monthlyCost)}</span>
          <span className="bento-meta">
            {t('dashboard.bento.yearly', { amount: formatEuro(stats.subscriptions.monthlyCost * 12) })}
            {' · '}
            {t('dashboard.bento.activeSubs', { count: stats.subscriptions.total })}
          </span>
          {sparkline.length > 0 && (
            <span className="bento-spark" aria-hidden="true">
              {sparkline.map((value, i) => (
                <span key={i} style={{ height: `${Math.max(6, (value / sparkMax) * 100)}%` }} />
              ))}
            </span>
          )}
          <span className="bento-link">{viewAllSubscriptionsLabel} →</span>
        </Link>

        <article className="bento-card bento-renewals">
          <div className="bento-row">
            <span className="bento-label">{t('dashboard.upcomingRenewals')}</span>
            <span className="bento-pill">{t('dashboard.bento.next30', { count: stats.subscriptions.upcomingRenewals })}</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="bento-empty">{t('dashboard.bento.noRenewals')}</p>
          ) : (
            <ul className="bento-list">
              {upcoming.map((sub) => (
                <li key={sub.id}>
                  <Link to={`/tools/${sub.toolId}`}>
                    <span className="bento-list-name">{sub.toolName}</span>
                    <span className={`bento-when ${daysUntil(sub.renewalDate) <= 3 ? 'is-soon' : ''}`}>{whenLabel(sub.renewalDate)}</span>
                    <span className="bento-list-price">{formatEuro(sub.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <Link to="/tools" className="bento-card bento-stat">
          <span className="bento-icon" aria-hidden="true">🧰</span>
          <span className="bento-label">{t('dashboard.totalTools')}</span>
          <span className="bento-num">{stats.tools.total}</span>
          <span className="bento-meta">
            {t('dashboard.active')}: {stats.tools.byStatus?.ACTIVE || 0} · {t('dashboard.inactive')}: {stats.tools.byStatus?.INACTIVE || 0}
          </span>
        </Link>

        <article className="bento-card bento-stat">
          <span className="bento-icon" aria-hidden="true">📅</span>
          <span className="bento-label">{t('dashboard.bento.nextPayment')}</span>
          {upcoming[0] ? (
            <>
              <span className="bento-num">{formatEuro(upcoming[0].price)}</span>
              <span className="bento-meta">{upcoming[0].toolName} · {whenLabel(upcoming[0].renewalDate)}</span>
            </>
          ) : (
            <span className="bento-meta">{t('dashboard.bento.noRenewals')}</span>
          )}
        </article>

        <article className="bento-card bento-stat">
          <span className="bento-icon" aria-hidden="true">💎</span>
          <span className="bento-label">{t('dashboard.bento.mostExpensive')}</span>
          {stats.expensiveTools[0] ? (
            <>
              <span className="bento-num">{formatEuro(stats.expensiveTools[0].price)}</span>
              <span className="bento-meta">{stats.expensiveTools[0].name}</span>
            </>
          ) : (
            <span className="bento-meta">{t('dashboard.noPricingInfo')}</span>
          )}
        </article>

        <article className="bento-card bento-stat">
          <span className="bento-icon" aria-hidden="true">🏷️</span>
          <span className="bento-label">{t('dashboard.categories')}</span>
          <span className="bento-num">{stats.categories}</span>
          <span className="bento-meta">{t('dashboard.toolCategories')}</span>
        </article>
      </section>

      {stats.charts && stats.subscriptions.total > 0 && (
        <div className="charts-grid">
          <div className="dashboard-section">
            <CostByCategoryChart data={stats.charts.costByCategory} />
          </div>
          <div className="dashboard-section">
            <UpcomingPaymentsChart data={stats.charts.upcomingPayments} />
          </div>
        </div>
      )}

      {stats.subscriptions.byTool && stats.subscriptions.byTool.length > 0 && (
        <section className="dashboard-section">
          <div className="section-head">
            <h2>{t('dashboard.yourSubscriptions')}</h2>
            <Link to="/subscriptions" className="section-link">{viewAllSubscriptionsLabel} →</Link>
          </div>
          <div className="subscriptions-grid">
            {stats.subscriptions.byTool.map((toolGroup) => (
              <div key={toolGroup.toolId} className="tool-subscription-card">
                <div className="tool-sub-header">
                  <h4>{toolGroup.toolName}</h4>
                  <span className="category-badge" style={{ '--cat': categoryColor(toolGroup.category) }}>
                    {categoryLabel(t, toolGroup.category)}
                  </span>
                </div>
                <div className="plans-list">
                  {toolGroup.subscriptions.map((sub) => (
                    <div key={sub.id} className="plan-row">
                      <div className="plan-info">
                        <span className="plan-name">{sub.plan}</span>
                        <span className="plan-cycle">{t(sub.billingCycle === 'yearly' ? 'toolDetail.yearly' : 'toolDetail.monthly')}</span>
                      </div>
                      <div className="plan-right">
                        <span className="plan-price">{formatEuro(sub.price)}</span>
                        <span className="plan-renewal">{new Date(sub.renewalDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-head">
          <h2>{t('dashboard.mostExpensiveTools')}</h2>
        </div>
        {stats.expensiveTools.length > 0 ? (
          <ol className="rank-list">
            {stats.expensiveTools.map((tool, index) => (
              <li key={tool.id}>
                <Link to={`/tools/${tool.id}`}>
                  <span className="rank-pos">{index + 1}</span>
                  <span className="rank-name">
                    {tool.name}
                    <small>{categoryLabel(t, tool.category?.name)}</small>
                  </span>
                  <span className="rank-price">{formatEuro(tool.price)}<small>/{t('dashboard.bento.month')}</small></span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state">{t('dashboard.noPricingInfo')}</p>
        )}
      </section>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => !exporting && setShowExportModal(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="export-modal-header">
              <h2>{t('export.title')}</h2>
              <button className="modal-close" onClick={() => setShowExportModal(false)} disabled={exporting} aria-label="Cerrar"></button>
            </div>

            <p className="export-modal-desc">{t('export.description')}</p>

            <div className="export-format-section">
              <label className="export-label">{t('export.format')}</label>
              <div className="export-format-options">
                <label className="format-option">
                  <input type="radio" name="format" value="csv" defaultChecked />
                  <span className="format-icon">📄</span>
                  <span className="format-name">CSV</span>
                  <span className="format-desc">{t('export.csvDesc')}</span>
                </label>
                <label className="format-option">
                  <input type="radio" name="format" value="json" />
                  <span className="format-icon">📋</span>
                  <span className="format-name">JSON</span>
                  <span className="format-desc">{t('export.jsonDesc')}</span>
                </label>
                <label className="format-option">
                  <input type="radio" name="format" value="pdf" />
                  <span className="format-icon">📕</span>
                  <span className="format-name">PDF</span>
                  <span className="format-desc">{t('export.pdfDesc')}</span>
                </label>
              </div>
            </div>

            <div className="export-include-section">
              <label className="export-label">{t('export.include')}</label>
              <div className="export-include-options">
                <label className="include-option">
                  <input type="radio" name="include" value="all" defaultChecked />
                  <span>{t('export.all')}</span>
                </label>
                <label className="include-option">
                  <input type="radio" name="include" value="tools" />
                  <span>{t('export.toolsOnly')}</span>
                </label>
                <label className="include-option">
                  <input type="radio" name="include" value="subscriptions" />
                  <span>{t('export.subscriptionsOnly')}</span>
                </label>
                <label className="include-option">
                  <input type="radio" name="include" value="movements" />
                  <span>{t('export.movementsOnly')}</span>
                </label>
              </div>
            </div>

            <div className="export-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowExportModal(false)} disabled={exporting}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const format = document.querySelector('input[name="format"]:checked')?.value || 'csv';
                  const include = document.querySelector('input[name="include"]:checked')?.value || 'all';
                  handleExport(format, include);
                }}
                disabled={exporting}
              >
                {exporting ? t('common.loading') : t('export.download')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;