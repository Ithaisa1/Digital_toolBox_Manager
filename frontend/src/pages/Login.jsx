/**
 * Formulario de inicio de sesión.
 * Corregido: mejor manejo de estado y prevención de race conditions.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Cleanup: evita memory leaks
  useEffect(() => {
    return () => {
      setError('');
      setLoading(false);
    };
  }, []);

  /** Envía credenciales y redirige al dashboard si el login es correcto. */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!email.trim() || !password.trim()) {
      setError(t('auth.emailPasswordRequired') || 'Email and password are required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Pequeño delay para asegurar que el estado se actualiza
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        setError(result.error || t('auth.loginFailed'));
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError(t('auth.unexpectedError') || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('auth.loginTitle')}</h1>
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
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>
        <p className="auth-link forgot-password-link">
          <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
        </p>
        <p className="auth-link">
          {t('auth.dontHaveAccount')} <Link to="/register">{t('auth.registerLink')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;