/**
 * Panel de administración: métricas globales de usuarios, herramientas y actividad.
 */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminStats();
    fetchAdminUsers();
  }, []);

  /** Carga estadísticas solo accesibles para rol ADMIN. */
  const fetchAdminStats = async () => {
    try {
      const response = await api.get('/dashboard/admin-stats');
      setStats(response.data);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load admin users', err);
    }
  };

  const handleToggleBlock = async (userId, isBlocked) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      fetchAdminUsers();
      fetchAdminStats();
    } catch (err) {
      console.error('Failed to update user status', err);
    }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div className="error">{t('dashboard.noData')}</div>;

  return (
    <div className="admin-dashboard-container">
      <h1>{t('admin.dashboard.title')}</h1>
      
      <div className="admin-stats-grid">
        <div className="stat-card">
          <h3>{t('admin.dashboard.totalUsers')}</h3>
          <p className="stat-number">{stats.users.total}</p>
          <p className="stat-detail">
            {t('admin.dashboard.activeUsers')}: {stats.users.active} | 
            {t('admin.dashboard.newUsers')}: {stats.users.newThisMonth}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>{t('admin.dashboard.totalTools')}</h3>
          <p className="stat-number">{stats.tools.total}</p>
          <p className="stat-detail">
            {t('admin.dashboard.activeTools')}: {stats.tools.active} | 
            {t('admin.dashboard.inactiveTools')}: {stats.tools.inactive}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>{t('admin.dashboard.totalSubscriptions')}</h3>
          <p className="stat-number">{stats.subscriptions.total}</p>
          <p className="stat-detail">
            {t('admin.dashboard.monthlyRevenue')}: {formatEuro(stats.subscriptions.monthlyRevenue)}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>{t('admin.dashboard.totalCategories')}</h3>
          <p className="stat-number">{stats.categories.total}</p>
        </div>
      </div>

      <div className="admin-dashboard-section">
        <h2>{t('admin.dashboard.recentActivity')}</h2>
        <div className="activity-list">
          {stats.recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <span className="activity-type">{activity.type}</span>
              <span className="activity-description">{activity.description}</span>
              <span className="activity-date">{new Date(activity.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-dashboard-section">
        <h2>{t('admin.dashboard.topUsers')}</h2>
        <div className="users-list">
          {stats.topUsers.map((user) => (
            <div key={user.id} className="user-item">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
              <span className="user-tools">{user._count.tools} {t('admin.dashboard.tools')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-dashboard-section">
        <h2>User Management</h2>
        <div className="users-list admin-user-management">
          {users.map((user) => (
            <div key={user.id} className="user-item">
              <div>
                <strong>{user.name}</strong> ({user.email})
                <div className="user-meta">
                  <span>{user.role}</span>
                  <span>{user.toolsCount} tools</span>
                  <span>{user.subscriptionsCount} subs</span>
                </div>
              </div>
              <button
                className={`btn ${user.isBlocked ? 'btn-outline' : 'btn-danger'}`}
                onClick={() => handleToggleBlock(user.id, user.isBlocked)}
              >
                {user.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
