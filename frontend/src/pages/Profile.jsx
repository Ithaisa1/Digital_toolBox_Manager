import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../components/ThemeToggle';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      renewal: true,
      priceChanges: false,
      newFeatures: true
    },
    theme: 'light',
    language: 'es'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscriptionStats, setSubscriptionStats] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name,
        email: user.email
      }));
      fetchSubscriptionStats();
    }
  }, [user]);

  const fetchSubscriptionStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setSubscriptionStats(response.data);
    } catch (err) {
      console.error('Error fetching subscription stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setMessage(t('profile.passwordMismatch'));
      setLoading(false);
      return;
    }

    if (profileData.newPassword && profileData.newPassword.length < 6) {
      setMessage(t('profile.passwordTooShort'));
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        name: profileData.name,
        ...(profileData.newPassword && { password: profileData.newPassword })
      };

      await api.put('/auth/profile', updateData);
      setMessage(t('profile.updateSuccess'));
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage(t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key) => {
    setProfileData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleThemeChange = (theme) => {
    setProfileData(prev => ({ ...prev, theme }));
    document.body.className = theme;
  };

  const handleLanguageChange = (language) => {
    setProfileData(prev => ({ ...prev, language }));
    localStorage.setItem('language', language);
    window.location.reload();
  };

  if (!user) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-content">
          <h1>{t('profile.title')}</h1>
          <ThemeToggle className="header-theme-toggle" />
        </div>
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <span className={`role-badge ${user.role.toLowerCase()}`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3>{t('profile.personalInfo')}</h3>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>{t('profile.name')}</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t('profile.email')}</label>
              <input
                type="email"
                value={profileData.email}
                disabled
              />
            </div>

            <div className="password-section">
              <h4>{t('profile.changePassword')}</h4>
              <div className="form-group">
                <label>{t('profile.currentPassword')}</label>
                <input
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>{t('profile.newPassword')}</label>
                <input
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>{t('profile.confirmPassword')}</label>
                <input
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            {message && (
              <div className={`message ${message.includes('Success') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('common.loading') : t('profile.saveChanges')}
            </button>
          </form>
        </div>

        <div className="profile-section">
          <h3>{t('profile.notifications')}</h3>
          <div className="notification-settings">
            <label className="notification-item">
              <input
                type="checkbox"
                checked={profileData.notifications.email}
                onChange={() => handleNotificationChange('email')}
              />
              <span>{t('profile.emailNotifications')}</span>
            </label>
            
            <label className="notification-item">
              <input
                type="checkbox"
                checked={profileData.notifications.renewal}
                onChange={() => handleNotificationChange('renewal')}
              />
              <span>{t('profile.renewalNotifications')}</span>
            </label>
            
            <label className="notification-item">
              <input
                type="checkbox"
                checked={profileData.notifications.priceChanges}
                onChange={() => handleNotificationChange('priceChanges')}
              />
              <span>{t('profile.priceChangeNotifications')}</span>
            </label>
            
            <label className="notification-item">
              <input
                type="checkbox"
                checked={profileData.notifications.newFeatures}
                onChange={() => handleNotificationChange('newFeatures')}
              />
              <span>{t('profile.newFeatureNotifications')}</span>
            </label>
          </div>
        </div>

        <div className="profile-section">
          <h3>{t('profile.appearance')}</h3>
          <div className="appearance-settings">
            <div className="setting-group">
              <label>{t('profile.theme')}</label>
              <div className="theme-selector">
                <button
                  className={`theme-btn ${profileData.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  ☀️ {t('profile.lightTheme')}
                </button>
                <button
                  className={`theme-btn ${profileData.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  🌙 {t('profile.darkTheme')}
                </button>
              </div>
            </div>
            
            <div className="setting-group">
              <label>{t('profile.language')}</label>
              <div className="language-selector">
                <button
                  className={`lang-btn ${profileData.language === 'es' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('es')}
                >
                  🇪🇸 Español
                </button>
                <button
                  className={`lang-btn ${profileData.language === 'en' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>
          </div>
        </div>

        {subscriptionStats && (
          <div className="profile-section">
            <h3>{t('profile.subscriptionStats')}</h3>
            <div className="stats-card">
              <div className="stat-item">
                <span className="stat-label">{t('profile.totalSubscriptions')}</span>
                <span className="stat-value">{subscriptionStats.subscriptions.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('profile.monthlyCost')}</span>
                <span className="stat-value">${subscriptionStats.subscriptions.monthlyCost.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('profile.yearlyCost')}</span>
                <span className="stat-value">${(subscriptionStats.subscriptions.monthlyCost * 12).toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('profile.averageCost')}</span>
                <span className="stat-value">
                  ${subscriptionStats.subscriptions.total > 0 
                    ? (subscriptionStats.subscriptions.monthlyCost / subscriptionStats.subscriptions.total).toFixed(2)
                    : '0.00'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="profile-section">
          <h3>{t('profile.dangerZone')}</h3>
          <div className="danger-zone">
            <p>{t('profile.dangerZoneDescription')}</p>
            <button onClick={logout} className="btn btn-danger">
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
