import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esTranslations from './translations/es.json';
import enTranslations from './translations/en.json';

const resources = {
  es: { translation: esTranslations },
  en: { translation: enTranslations }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
