/**
 * Panel del usuario: estadísticas de herramientas, suscripciones y costes.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

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
      const url = `${import.meta.env.VITE_API_URL}/api/export/data?${params}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || '';
      const ext = contentType.includes('pdf') ? 'pdf' : contentType.includes('json') ? 'json' : 'csv';
      downloadBlob(blob, `toolbox-${getToday()}.${ext}`);
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="dashboard-heading">
            <h1>{t('dashboard.title')}</h1>
            <p className="dashboard-subtitle">{dashboardSubtitle}</p>
          </div>
          <button
            className="btn-export"
            onClick={() => setShowExportModal(true)}
            aria-label={t('export.title')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {t('export.title')}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <Link to="/tools" className="stat-card dashboard-stat-card stat-card-link" aria-label={t('dashboard.totalTools')}>
          <h3>{t('dashboard.totalTools')}</h3>
          <p className="stat-number">{stats.tools.total}</p>
          <p className="stat-detail">
            {t('dashboard.active')}: {stats.tools.byStatus?.ACTIVE || 0} | {t('dashboard.inactive')}: {stats.tools.byStatus?.INACTIVE || 0}
          </p>
          <span className="stat-card-link-text">{viewToolsLabel}</span>
        </Link>

        <Link to="/subscriptions" className="stat-card dashboard-stat-card stat-card-link" aria-label={t('dashboard.subscriptions')}>
          <h3>{t('dashboard.subscriptions')}</h3>
          <p className="stat-number">{stats.subscriptions.total}</p>
          <p className="stat-detail">
            {t('dashboard.monthlyCost')}: {formatEuro(stats.subscriptions.monthlyCost)}
          </p>
          <span className="stat-card-link-text">{viewAllSubscriptionsLabel}</span>
        </Link>

        <div className="stat-card dashboard-stat-card">
          <h3>{t('dashboard.upcomingRenewals')}</h3>
          <p className="stat-number">{stats.subscriptions.upcomingRenewals}</p>
          <p className="stat-detail">{t('dashboard.next30Days')}</p>
        </div>

        <div className="stat-card dashboard-stat-card">
          <h3>{t('dashboard.categories')}</h3>
          <p className="stat-number">{stats.categories}</p>
          <p className="stat-detail">{t('dashboard.toolCategories')}</p>
        </div>
      </div>

      {/* SUSCRIPCIONES AGRUPADAS POR HERRAMIENTA */}
      {stats.subscriptions.byTool && stats.subscriptions.byTool.length > 0 && (
        <div className="dashboard-section">
          <h2>{t('dashboard.yourSubscriptions')}</h2>
          <div className="subscriptions-grid">
            {stats.subscriptions.byTool.map((toolGroup) => (
              <div key={toolGroup.toolId} className="tool-subscription-card">
                <div className="tool-sub-header">
                  <h4>{toolGroup.toolName}</h4>
                  <span className="category-badge">{toolGroup.category}</span>
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
        </div>
      )}

      <div className="dashboard-section">
        <h2>{t('dashboard.mostExpensiveTools')}</h2>
        {stats.expensiveTools.length > 0 ? (
          <div className="tools-list">
            {stats.expensiveTools.map((tool) => (
              <div key={tool.id} className="tool-item">
                <h4>{tool.name}</h4>
                <p className="tool-price">{formatEuro(tool.price)}/mo</p>
                <p className="tool-category">{tool.category?.name || (isSpanish ? 'Sin categoria' : 'Uncategorized')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No pricing information available</p>
        )}
      </div>

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