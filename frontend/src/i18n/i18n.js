/**
 * Configuración de i18next: español e inglés con idioma persistido en localStorage.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import esTranslations from "./translations/es.json";
import enTranslations from "./translations/en.json";

const resources = {
  es: { translation: esTranslations },
  en: { translation: enTranslations },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "es",
  fallbackLng: "es",
  supportedLngs: ["es", "en"],
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
