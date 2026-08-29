'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'kokan-ghar-theme';

/**
 * Returns the user's saved theme, or 'system' if nothing stored.
 * 'system' means "follow the OS preference".
 */
function getStoredTheme() {
  if (typeof window === 'undefined') return 'system';
  return localStorage.getItem(STORAGE_KEY) || 'system';
}

/**
 * Given a theme preference ('light' | 'dark' | 'system'),
 * resolve it to an actual mode ('light' | 'dark').
 */
function resolveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  // 'system' → check OS preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Apply or remove the 'dark' class on <html> to activate Tailwind dark mode.
 */
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export default function ThemeProvider({ children }) {
  const [themePref, setThemePref] = useState('system');
  const [resolved, setResolved] = useState('light');
  const [mounted, setMounted] = useState(false);

  // On mount: read localStorage, resolve, apply
  useEffect(() => {
    const stored = getStoredTheme();
    const mode = resolveTheme(stored);
    setThemePref(stored);
    setResolved(mode);
    applyTheme(mode);
    setMounted(true);
  }, []);

  // Listen for OS preference changes (when theme is 'system')
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (getStoredTheme() === 'system') {
        const mode = e.matches ? 'dark' : 'light';
        setResolved(mode);
        applyTheme(mode);
      }
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((pref) => {
    localStorage.setItem(STORAGE_KEY, pref);
    setThemePref(pref);
    const mode = resolveTheme(pref);
    setResolved(mode);
    applyTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolved, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme: resolved, themePref, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}
