import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../components/ThemeToggle';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div className="error">{t('dashboard.noData')}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>{t('dashboard.title')}</h1>
            <p>{t('dashboard.subtitle')}</p>
          </div>
          <ThemeToggle className="header-theme-toggle" />
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t('dashboard.totalTools')}</h3>
          <p className="stat-number">{stats.tools.total}</p>
          <p className="stat-detail">
            {t('dashboard.active')}: {stats.tools.byStatus.ACTIVE || 0} | 
            {t('dashboard.inactive')}: {stats.tools.byStatus.INACTIVE || 0}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard.subscriptions')}</h3>
          <p className="stat-number">{stats.subscriptions.total}</p>
          <p className="stat-detail">
            {t('dashboard.monthlyCost')}: ${stats.subscriptions.monthlyCost.toFixed(2)}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard.upcomingRenewals')}</h3>
          <p className="stat-number">{stats.subscriptions.upcomingRenewals}</p>
          <p className="stat-detail">{t('dashboard.next30Days')}</p>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard.categories')}</h3>
          <p className="stat-number">{stats.categories}</p>
          <p className="stat-detail">{t('dashboard.toolCategories')}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>{t('dashboard.mostExpensiveTools')}</h2>
        {stats.expensiveTools.length > 0 ? (
          <div className="tools-list">
            {stats.expensiveTools.map((tool) => (
              <div key={tool.id} className="tool-item">
                <h4>{tool.name}</h4>
                <p className="tool-price">${tool.price.toFixed(2)}/mo</p>
                <p className="tool-category">{tool.category?.name || t('common.uncategorized')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">{t('dashboard.noPricingInfo')}</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
