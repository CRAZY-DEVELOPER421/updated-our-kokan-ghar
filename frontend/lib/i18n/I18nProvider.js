'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

const STORAGE_KEY = 'konkan-language';

const I18nContext = createContext(null);

const translationsMap = {
  en: require('./translations/en.json'),
  hi: require('./translations/hi.json'),
  mr: require('./translations/mr.json'),
  gu: require('./translations/gu.json'),
  kn: require('./translations/kn.json'),
};

function loadTranslations(langCode) {
  return translationsMap[langCode] || translationsMap.en;
}

// Load English translations eagerly so server and client first render match,
// preventing hydration mismatches. The user's stored language preference is
// applied after mount via useEffect.
const defaultTranslations = loadTranslations('en');

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [translations, setTranslations] = useState(defaultTranslations);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== 'en') {
      setLang(stored);
      setTranslations(loadTranslations(stored));
    }
    setReady(true);
  }, []);

  const changeLanguage = useCallback((code) => {
    setLang(code);
    setTranslations(loadTranslations(code));
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
  }, []);

  const t = useCallback((key, params = {}) => {
    if (!translations) return params._default || key;
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return params._default || key;
      }
    }
    if (typeof value !== 'string') return params._default || key;
    return value.replace(/\{(\w+)\}/g, (_, p) => params[p] !== undefined ? params[p] : `{${p}}`);
  }, [translations]);

  return (
    <I18nContext.Provider value={{ lang, changeLanguage, t, LANGUAGES, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: 'en',
      changeLanguage: () => {},
      t: (key) => key,
      LANGUAGES,
      ready: true,
    };
  }
  return ctx;
}

export { LANGUAGES };
