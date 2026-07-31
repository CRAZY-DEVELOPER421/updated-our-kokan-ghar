'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAdminAuthStore from '@/lib/store/adminAuthStore';
import api from '@/lib/api';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { adminLogin } = useAdminAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    // First authenticate locally (UI access)
    const result = await adminLogin(password);

    if (result.success) {
      // Also authenticate with backend to get JWT token for API calls
      try {
        const res = await api.post('/admin/login', { password });
        if (res.data.success && res.data.data.accessToken) {
          localStorage.setItem('accessToken', res.data.data.accessToken);
          console.log('✅ Admin JWT token obtained for API calls');
        }
      } catch (err) {
        // Log warning but still allow access - admin pages may show limited data
        console.warn('⚠️ Backend auth failed (JWT not obtained). Some data may not load:', err.message);
      }
      router.push('/')
    } else {
      setError(result.message);
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-konkan-saffron shadow-lg shadow-konkan-saffron/30 mb-4">
            <span className="text-white text-lg font-bold">KB</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Control Panel</h1>
          <p className="text-konkan-green-light/60 text-sm mt-1">Authorized access only</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1B4332]/80 backdrop-blur-sm border border-konkan-green-primary/30 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-konkan-green-light/70 mb-1.5 tracking-wide uppercase">Access Key</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter access key"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary/50 transition-all"
                autoFocus
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-konkan-green-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-konkan-saffron text-xs mt-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-konkan-green-primary hover:bg-konkan-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Authenticate'
            )}
          </button>
        </form>

        <p className="text-center text-konkan-green-light/30 text-xs mt-6">Secure management interface</p>
      </div>
    </div>
  );
}
