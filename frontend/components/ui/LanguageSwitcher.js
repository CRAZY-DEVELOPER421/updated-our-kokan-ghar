'use client';

import { useTranslation } from '@/lib/i18n/I18nProvider';

export default function LanguageSwitcher({ variant = 'dropdown', className = '' }) {
  const { lang, changeLanguage, LANGUAGES } = useTranslation();

  if (variant === 'flag') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => changeLanguage(l.code)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              lang === l.code
                ? 'bg-konkan-green-primary text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title={l.name}
          >
            {l.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }
  // Default 'dropdown' — a styled language selector, used on the account
  // Settings and Profile pages.
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={lang}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none bg-konkan-cream border border-konkan-sand/60 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-konkan-text-primary cursor-pointer hover:border-konkan-green-primary/40 hover:bg-white focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary transition-all min-w-[160px]"
        aria-label="Select language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-gray-900 bg-white">
            {l.nativeName} — {l.name}
          </option>
        ))}
      </select>
      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-konkan-text-secondary/60 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
