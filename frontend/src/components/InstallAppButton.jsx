/**
 * Botón "Instalar app".
 * - Chrome, Edge, Android: abre el diálogo de instalación del navegador.
 * - iPhone/iPad: explica cómo añadirla a la pantalla de inicio.
 * - Si ya está instalada o el navegador no lo permite, no se muestra.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import './InstallAppButton.css';

const InstallAppButton = ({ onDone }) => {
  const { t } = useTranslation();
  const { canPrompt, showIOSHelp, promptInstall } = useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!showHelp) return undefined;
    const onKey = (e) => e.key === 'Escape' && setShowHelp(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showHelp]);

  if (!canPrompt && !showIOSHelp) return null;

  const handleClick = async () => {
    if (canPrompt) {
      await promptInstall();
      onDone?.();
    } else {
      setShowHelp(true);
    }
  };

  return (
    <>
      <button
        type="button"
        className="install-app-btn"
        onClick={handleClick}
        aria-label={t('pwa.install')}
        title={t('pwa.install')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M12 8v7M9 12l3 3 3-3" />
        </svg>
        <span className="install-app-label">{t('pwa.install')}</span>
      </button>

      {showHelp && (
        <div className="install-help-overlay" onClick={() => setShowHelp(false)}>
          <div
            className="install-help"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <img src="/icons/icon-192.png" alt="" width="64" height="64" className="install-help-icon" />
            <h2 id="install-help-title">{t('pwa.iosTitle')}</h2>
            <ol>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={t('pwa.share')} className="install-help-share">
                  <path d="M12 3v12M8 7l4-4 4 4" />
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                </svg>
                {t('pwa.iosStep1')}
              </li>
              <li>{t('pwa.iosStep2')}</li>
              <li>{t('pwa.iosStep3')}</li>
            </ol>
            <button type="button" className="btn btn-primary" onClick={() => setShowHelp(false)}>
              {t('pwa.gotIt')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppButton;
