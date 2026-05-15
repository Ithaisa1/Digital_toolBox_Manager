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
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

  const dashboardSubtitle = isSpanish
    ? 'Centraliza y gestiona tus herramientas en un solo lugar'
    : 'Centralize and manage your tools in one place';
  const viewAllSubscriptionsLabel = isSpanish ? 'Ver todas' : 'View all';
  const viewToolsLabel = isSpanish ? 'Ver herramientas' : 'View tools';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div className="error">No data available</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="dashboard-heading">
            <h1>{t('dashboard.title')}</h1>
            <p className="dashboard-subtitle">{dashboardSubtitle}</p>
          </div>
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
          <p className="stat-detail">Next 30 days</p>
        </div>

        <div className="stat-card dashboard-stat-card">
          <h3>{t('dashboard.categories')}</h3>
          <p className="stat-number">{stats.categories}</p>
          <p className="stat-detail">Tool categories</p>
        </div>
      </div>

      {/* SUSCRIPCIONES AGRUPADAS POR HERRAMIENTA */}
      {stats.subscriptions.byTool && stats.subscriptions.byTool.length > 0 && (
        <div className="dashboard-section">
          <h2>Your Subscriptions</h2>
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
                        <span className="plan-cycle">{sub.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
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
        <h2>Most Expensive Tools</h2>
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
    </div>
  );
};

export default Dashboard;