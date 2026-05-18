import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError(t('auth.invalidResetToken') || 'Invalid reset link');
    }
  }, [searchParams, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError(t('auth.passwordRequired') || 'All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch') || 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      const apiData = err.response?.data;
      const details = apiData?.details
        ? apiData.details.map((d) => `${d.campo}: ${d.mensaje}`).join(', ')
        : null;
      setError(details || apiData?.error || t('auth.resetFailed') || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>{t('auth.passwordResetTitle')}</h1>
          <div className="success-message" role="status">
            <p>{t('auth.passwordResetSuccess')}</p>
          </div>
          <p className="auth-link">
            <Link to="/login">{t('auth.loginLink')}</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>{t('auth.passwordResetTitle')}</h1>
          <div className="error" role="alert">{error}</div>
          <p className="auth-link">
            <Link to="/forgot-password">{t('auth.requestNewResetLink')}</Link>
          </p>
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
        <h1>{t('auth.passwordResetTitle')}</h1>
        {error && <div className="error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">{t('auth.newPassword')}:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.resetPassword')}
          </button>
        </form>
        <p className="auth-link">
          <Link to="/login">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
