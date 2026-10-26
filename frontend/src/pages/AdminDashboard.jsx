/**
 * Panel de administración: métricas globales de usuarios, herramientas y actividad.
 */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import Pagination from '../components/Pagination';
import './AdminDashboard.css';

const USERS_PER_PAGE = 10;

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  // Carga la página de usuarios; espera 300 ms tras teclear para no saturar la API
  useEffect(() => {
    const timer = setTimeout(() => fetchAdminUsers(), userSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [userSearch, userPage]);

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
      const response = await api.get('/admin/users', {
        params: { q: userSearch || undefined, page: userPage, limit: USERS_PER_PAGE },
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load admin users', err);
    }
  };

  const handleToggleBlock = async (userId) => {
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
        <h2>{t('admin.dashboard.userManagement')}</h2>
        <input
          type="search"
          className="admin-user-search"
          placeholder={t('admin.dashboard.searchUsers')}
          value={userSearch}
          onChange={(e) => {
            setUserSearch(e.target.value);
            setUserPage(1);
          }}
          aria-label={t('admin.dashboard.searchUsers')}
        />
        {users.items.length === 0 && (
          <p className="admin-user-empty">{t('admin.dashboard.noUsersFound')}</p>
        )}
        <div className="users-list admin-user-management">
          {users.items.map((user) => (
            <div key={user.id} className="user-item">
              <div>
                <strong>{user.name}</strong> ({user.email})
                <div className="user-meta">
                  <span>{user.role}</span>
                  <span>{user.toolsCount} {t('admin.dashboard.tools')}</span>
                  <span>{user.subscriptionsCount} {t('admin.dashboard.subs')}</span>
                </div>
              </div>
              <button
                className={`btn ${user.isBlocked ? 'btn-outline' : 'btn-danger'}`}
                onClick={() => handleToggleBlock(user.id)}
              >
                {user.isBlocked ? t('admin.dashboard.unblock') : t('admin.dashboard.block')}
              </button>
            </div>
          ))}
        </div>
        <Pagination
          page={users.page}
          totalPages={users.totalPages}
          total={users.total}
          pageSize={USERS_PER_PAGE}
          onPageChange={setUserPage}
          scrollToTop={false}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
