import { createInstance } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import ko from '../locales/ui.ko.json';
import en from '../locales/ui.en.json';
import catalogEn from '../locales/catalog.en.json';

export function createAppI18n(language?: string) {
  const instance = createInstance();
  void instance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: language,
      resources: {
        ko: {
          ui: ko,
          catalog: Object.fromEntries(Object.keys(catalogEn).map((text) => [text, text])),
        },
        en: { ui: en, catalog: catalogEn },
      },
      supportedLngs: ['ko', 'en'],
      fallbackLng: 'en',
      load: 'languageOnly',
      defaultNS: 'ui',
      ns: ['ui', 'catalog'],
      keySeparator: false,
      nsSeparator: false,
      initAsync: false,
      detection: { order: ['navigator'], caches: [] },
      interpolation: { escapeValue: false },
    });
  return instance;
}

export const i18n = createAppI18n();
