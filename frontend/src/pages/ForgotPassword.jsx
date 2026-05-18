import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(t('auth.emailRequired') || 'Email is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccess(true);
    } catch (err) {
      const apiData = err.response?.data;
      const details = apiData?.details
        ? apiData.details.map((d) => `${d.campo}: ${d.mensaje}`).join(', ')
        : null;
      setError(details || apiData?.error || t('auth.unexpectedError') || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>{t('auth.forgotPasswordTitle')}</h1>
          <div className="success-message" role="status">
            <p>{t('auth.resetEmailSent')}</p>
            <p className="success-hint">{t('auth.checkInbox')}</p>
          </div>
          <p className="auth-link">
            <Link to="/login">{t('auth.backToLogin')}</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('auth.forgotPasswordTitle')}</h1>
        {error && <div className="error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.sendResetLink')}
          </button>
        </form>
        <p className="auth-link">
          <Link to="/login">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
