'use client';

import Link from 'next/link';
import useAuthStore from '@/lib/store/authStore';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTheme } from '@/lib/providers/ThemeProvider';

const ROWS = [
  {
    label: 'Notifications',
    desc: 'Order updates, offers & alerts',
    href: '/account/notifications',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    desc: 'Name, email, phone & password',
    href: '/account/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Saved Addresses',
    desc: 'Manage delivery addresses',
    href: '/account/addresses',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Help Center',
    desc: 'FAQs, guides and support',
    href: '/faq',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Language */}
      <div className="bg-white rounded-2xl card p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-lg text-konkan-text-primary">Language</h2>
            <p className="text-xs text-konkan-text-secondary">Choose your preferred language</p>
          </div>
          <LanguageSwitcher variant="dropdown" />
        </div>
      </div>

      {/* Dark Mode */}
      <div className="bg-white rounded-2xl card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg text-konkan-text-primary">Dark Mode</h2>
            <p className="text-xs text-konkan-text-secondary">Switch between light and dark theme</p>
          </div>
          <button
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-full transition-colors duration-300 shrink-0"
            style={{ backgroundColor: theme === 'dark' ? '#3A7D5C' : '#D1D5DB' }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span
              className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300"
              style={{ transform: theme === 'dark' ? 'translateX(28px)' : 'translateX(0)' }}
            >
              {theme === 'dark' ? (
                <svg className="w-3.5 h-3.5 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Settings rows */}
      <div className="bg-white rounded-2xl card divide-y divide-konkan-sand/40">
        {ROWS.map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className="flex items-center gap-3 p-3.5 hover:bg-konkan-cream transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-konkan-cream flex items-center justify-center text-konkan-green-primary shrink-0 group-hover:bg-konkan-green-primary group-hover:text-white transition-colors">
              {row.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-konkan-text-primary">{row.label}</p>
              <p className="text-xs text-konkan-text-secondary truncate">{row.desc}</p>
            </div>
            <svg className="w-4 h-4 text-konkan-sand group-hover:text-konkan-green-primary transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl card hover:bg-red-50 transition-colors text-left group"
      >
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-konkan-error shrink-0 group-hover:bg-konkan-error group-hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-konkan-error">Logout</p>
          <p className="text-xs text-konkan-text-secondary">Sign out from your account</p>
        </div>
      </button>
    </div>
  );
}
