import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const currentLanguage = i18n.language?.startsWith('es') ? 'es' : 'en';
  const languages = useMemo(() => ([
    {
      code: 'es',
      flag: String.fromCodePoint(0x1F1EA, 0x1F1F8),
      label: t('language.spanish'),
    },
    {
      code: 'en',
      flag: String.fromCodePoint(0x1F1EC, 0x1F1E7),
      label: t('language.english'),
    },
  ]), [t]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setOpen(false);
  };

  const current = languages.find((language) => language.code === currentLanguage) || languages[1];

  return (
    <div ref={rootRef} className={`language-dropdown ${className}`.trim()}>
      <button
        type="button"
        className="language-trigger"
        onClick={() => setOpen((state) => !state)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.language')}
      >
        <span className="language-flag" aria-hidden="true">{current.flag}</span>
        <span className="language-caret" aria-hidden="true">v</span>
      </button>
      {open && (
        <div className="language-menu" role="menu" aria-label={t('nav.language')}>
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              className={`language-option ${currentLanguage === language.code ? 'active' : ''}`}
              onClick={() => changeLanguage(language.code)}
              role="menuitem"
            >
              <span className="language-flag" aria-hidden="true">{language.flag}</span>
              <span className="language-label">{language.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
