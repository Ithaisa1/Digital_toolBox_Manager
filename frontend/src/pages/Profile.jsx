/**
 * Perfil de usuario: datos personales, contraseña, notificaciones y zona de peligro.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatEuro } from '../utils/formatCurrency';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    language: 'es',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [subscriptionStats, setSubscriptionStats] = useState(null);

  // Rellena el formulario y carga estadísticas cuando hay usuario
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        language: user.language || 'es',
      }));
      fetchSubscriptionStats();
    }
  }, [user]);

  const fetchSubscriptionStats = async () => {
    // Reutiliza el mismo endpoint que el dashboard
    try {
      const response = await api.get('/dashboard/stats');
      setSubscriptionStats(response.data);
    } catch (err) {
      console.error('Error fetching subscription stats:', err);
    }
  };

  /** Actualiza perfil y contraseña en el backend. */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setMessage(t('profile.passwordMismatch'));
      setMessageType('error');
      setLoading(false);
      return;
    }

    const updateData = {
      name: profileData.name,
      email: profileData.email,
      language: profileData.language,
      currentPassword: profileData.currentPassword || undefined,
      ...(profileData.newPassword && { newPassword: profileData.newPassword }),
    };

    try {
      const response = await api.put('/auth/profile', updateData);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      if (profileData.language) {
        await i18n.changeLanguage(profileData.language);
        localStorage.setItem('language', profileData.language);
      }

      await refreshUser();

      setMessage(t('profile.updateSuccess'));
      setMessageType('success');
      setProfileData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage(error.response?.data?.error || t('profile.updateError'));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  /** Elimina la cuenta tras confirmar con la contraseña actual. */
  const handleDeleteAccount = async () => {
    if (!window.confirm(t('profile.deleteAccountConfirm'))) return;

    if (!profileData.currentPassword) {
      setMessage(t('profile.currentPasswordRequired'));
      setMessageType('error');
      return;
    }

    try {
      await api.delete('/auth/profile', {
        data: {
          currentPassword: profileData.currentPassword
        }
      });

      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.error || t('profile.updateError'));
      setMessageType('error');
    }
  };

  if (!user) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-content">
          <h1>{t('profile.title')}</h1>
        </div>
        <div className="profile-hero">
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
                onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label>{t('profile.email')}</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label>{t('profile.language')}</label>
              <select
                value={profileData.language}
                onChange={(e) => setProfileData((prev) => ({ ...prev, language: e.target.value }))}
              >
                <option value="es">{t('language.spanish')}</option>
                <option value="en">{t('language.english')}</option>
              </select>
            </div>

            <div className="password-section">
              <h4>{t('profile.changePassword')}</h4>
              <p className="section-hint">{t('profile.passwordHint')}</p>
              <div className="form-group">
                <label>{t('profile.currentPassword')}</label>
                <input
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  autoComplete="current-password"
                />
              </div>

              <div className="form-group">
                <label>{t('profile.newPassword')}</label>
                <input
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label>{t('profile.confirmPassword')}</label>
                <input
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {message && (
              <div className={`message ${messageType || 'error'}`}>
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('common.loading') : t('profile.saveChanges')}
            </button>
          </form>
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
                <span className="stat-value">{formatEuro(subscriptionStats.subscriptions.monthlyCost)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('profile.yearlyCost')}</span>
                <span className="stat-value">{formatEuro(subscriptionStats.subscriptions.monthlyCost * 12)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('profile.averageCost')}</span>
                <span className="stat-value">
                  {formatEuro(
                    subscriptionStats.subscriptions.total > 0
                      ? subscriptionStats.subscriptions.monthlyCost / subscriptionStats.subscriptions.total
                      : 0
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="profile-section">
          <h3>{t('profile.dangerZone')}</h3>
          <div className="danger-zone">
            <p>{t('profile.dangerZoneDescription')}</p>
            <div className="danger-actions">
              <button onClick={logout} className="btn btn-secondary" type="button">
                {t('profile.logout')}
              </button>
              <button onClick={handleDeleteAccount} className="btn btn-danger" type="button">
                {t('profile.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
