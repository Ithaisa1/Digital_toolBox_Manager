/**
 * Acceso con un clic a las cuentas de demo (solo en la web de demo).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../hooks/useMeta';

const DemoAccess = () => {
  const { t } = useTranslation();
  const { demo, accounts } = useMeta();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  if (!demo || accounts.length === 0) return null;

  const enter = async (account) => {
    setBusy(account.role);
    setError('');
    const result = await login(account.email, account.password);
    if (result.success) {
      navigate(result.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    } else {
      setError(result.error);
      setBusy(null);
    }
  };

  return (
    <section className="demo-access" aria-labelledby="demo-access-title">
      <h2 id="demo-access-title">{t('demo.title')}</h2>
      <p>{t('demo.subtitle')}</p>
      <div className="demo-access-buttons">
        {accounts.map((account) => (
          <button
            key={account.role}
            type="button"
            className={`demo-account ${account.role === 'ADMIN' ? 'is-admin' : 'is-user'}`}
            onClick={() => enter(account)}
            disabled={Boolean(busy)}
          >
            <span className="demo-account-icon" aria-hidden="true">{account.role === 'ADMIN' ? '🛡️' : '👤'}</span>
            <span className="demo-account-text">
              <strong>{busy === account.role ? t('common.loading') : t(account.role === 'ADMIN' ? 'demo.asAdmin' : 'demo.asUser')}</strong>
              <small>{t(account.role === 'ADMIN' ? 'demo.adminHint' : 'demo.userHint')}</small>
              <code>{account.email} · {account.password}</code>
            </span>
          </button>
        ))}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="demo-access-divider"><span>{t('demo.orManual')}</span></p>
    </section>
  );
};

export default DemoAccess;
