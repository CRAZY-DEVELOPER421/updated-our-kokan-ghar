'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';

// Guest pincode / chosen location persists across sessions (Amazon-style).
const STORAGE_KEY = 'konkan-delivery-location';

export default function DeliveryLocation({ className = '' }) {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [selected, setSelected] = useState(null); // { id?, city, pincode } chosen saved address
  const [guestPincode, setGuestPincode] = useState(null);
  const [explicitPincode, setExplicitPincode] = useState(false); // user manually chose a pincode
  const wrapRef = useRef(null);

  // Restore the saved delivery location from localStorage (after mount — no SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasAddress = !!parsed?.address?.city;
        setExplicitPincode(!!parsed?.pincode && !hasAddress);
        setGuestPincode(parsed?.pincode || null);
        if (hasAddress) {
          setSelected({ id: parsed.address.id, city: parsed.address.city, pincode: parsed.address.pincode });
        }
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Saved addresses (only fetched when signed in)
  const { data: addresses = [] } = useQuery({
    queryKey: ['nav-addresses'],
    queryFn: async () => {
      const res = await api.get('/users/addresses');
      return res.data.data.addresses || [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Fall back to the default (or first) saved address when it loads — unless the
  // user explicitly chose a pincode (that choice must not be silently overridden).
  useEffect(() => {
    if (addresses.length > 0 && !explicitPincode) {
      setSelected((cur) => {
        if (cur?.city) return cur;
        const def = addresses.find((a) => a.is_default) || addresses[0];
        return { id: def.id, city: def.city, pincode: def.pincode };
      });
    }
  }, [addresses, explicitPincode]);

  // Close when clicking outside / pressing Escape
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const applyPincode = () => {
    const clean = pincode.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pincode: clean, address: null }));
    setGuestPincode(clean);
    setSelected(null);
    setExplicitPincode(true);
    setOpen(false);
  };

  const chooseAddress = (addr) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      pincode: addr.pincode,
      address: { id: addr.id, city: addr.city, pincode: addr.pincode },
    }));
    setSelected({ id: addr.id, city: addr.city, pincode: addr.pincode });
    setGuestPincode(null);
    setExplicitPincode(false);
    setOpen(false);
  };

  const line2 = selected
    ? `${selected.city} ${selected.pincode}`
    : guestPincode
      ? `Pincode ${guestPincode}`
      : 'Select location';

  return (
    <div ref={wrapRef} className={`relative hidden lg:block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors text-left ${
          open ? 'bg-konkan-cream' : 'hover:bg-konkan-cream/70'
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Delivery location"
      >
        <svg className="w-5 h-5 text-konkan-green-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="min-w-0">
          <span className="block text-[10px] leading-tight text-konkan-text-secondary">Deliver to</span>
          <span className="block text-xs font-bold text-konkan-text-primary leading-tight truncate max-w-[130px]">{line2}</span>
        </span>
        <svg className="w-3 h-3 text-konkan-text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose your delivery location"
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-modal border border-konkan-sand overflow-hidden z-50"
        >
          {/* Pincode entry */}
          <div className="p-4 border-b border-konkan-sand/50">
            <p className="text-sm font-semibold text-konkan-text-primary">Choose your delivery location</p>
            <p className="text-xs text-konkan-text-secondary mt-0.5 mb-3">Enter your pincode to see delivery options.</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                applyPincode();
              }}
            >
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit pincode"
                className="flex-1 min-w-0 border border-konkan-sand rounded-lg px-3 py-2 text-sm text-konkan-text-primary focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary transition-all"
                inputMode="numeric"
                id="delivery-pincode"
                name="delivery-pincode"
                aria-label="Delivery pincode"
                autoComplete="postal-code"
              />
              <button
                type="submit"
                disabled={pincode.length !== 6}
                className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-konkan-green-primary hover:bg-konkan-green-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Saved addresses */}
          {isAuthenticated && addresses.length > 0 && (
            <div className="p-2 max-h-52 overflow-y-auto">
              <p className="px-2.5 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary">
                Saved addresses
              </p>
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => chooseAddress(addr)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg hover:bg-konkan-cream transition-colors ${
                    selected?.id === addr.id ? 'bg-konkan-cream' : ''
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-konkan-text-primary">
                    {addr.city}, {addr.state}
                    {addr.is_default === 1 && (
                      <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-konkan-green-primary/10 text-konkan-green-primary">Default</span>
                    )}
                  </span>
                  <span className="block text-xs text-konkan-text-secondary truncate">
                    {addr.house_no}, {addr.street} — {addr.pincode}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="p-2 border-t border-konkan-sand/50">
            {isAuthenticated ? (
              <Link
                href="/account/addresses"
                onClick={() => setOpen(false)}
                className="block w-full text-center px-3 py-2 text-xs font-semibold text-konkan-green-primary hover:bg-konkan-cream rounded-lg transition-colors"
              >
                {addresses.length > 0 ? 'Manage saved addresses' : 'Add a delivery address'}
              </Link>
            ) : (
              <p className="text-center text-[11px] text-konkan-text-secondary px-3 py-1.5">
                <Link href="/login" onClick={() => setOpen(false)} className="text-konkan-green-primary font-semibold hover:underline">
                  Sign in
                </Link>{' '}
                to use your saved address
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
