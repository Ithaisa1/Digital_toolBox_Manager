/**
 * Aviso fijo cuando no hay conexión: la app sigue abriendo, pero los datos no se actualizan.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const OfflineBanner = () => {
  const { t } = useTranslation();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  if (online) return null;

  return (
    <div className="offline-banner" role="status">
      <span aria-hidden="true">📡</span> {t('pwa.offline')}
    </div>
  );
};

export default OfflineBanner;
