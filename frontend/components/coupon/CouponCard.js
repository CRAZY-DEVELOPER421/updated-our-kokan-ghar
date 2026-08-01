'use client';

import { useState, useCallback } from 'react';

/* ── Formatting helpers (shared by offers page + coupons page) ── */

export function formatDiscount(coupon) {
  const value = Number(coupon.value) || 0;
  switch (coupon.type) {
    case 'percentage':
      return `${value}% OFF`;
    case 'flat':
      return `Flat ₹${value.toLocaleString('en-IN')} OFF`;
    case 'free_shipping':
      return 'Free Delivery';
    case 'bogo':
      return coupon.description || 'Buy 1 Get 1';
    default:
      return `${value} OFF`;
  }
}

export function formatMinOrder(amount) {
  if (!amount || amount <= 0) return 'No minimum order';
  return `On orders above ₹${Number(amount).toLocaleString('en-IN')}`;
}

export function formatExpiry(dateStr) {
  if (!dateStr) return null;
  try {
    return `Valid till ${new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } catch {
    return null;
  }
}

// Accent palette per coupon type — drives icon box, category label, Copy button, code pill
const COUPON_STYLES = {
  percentage: { color: '#E87722', label: 'Welcome Offer' },
  flat: { color: '#2D6A4F', label: 'Flat Offer' },
  free_shipping: { color: '#1A6B8A', label: 'Free Delivery' },
  bogo: { color: '#7C3AED', label: 'Bogo Deal' },
};

function getCouponStyle(coupon) {
  return COUPON_STYLES[coupon?.type] || COUPON_STYLES.flat;
}

/* ── Standardized icon set — all 20px (w-5 h-5), strokeWidth 2, currentColor ── */

function CouponIcon({ type }) {
  const cls = 'w-5 h-5';
  if (type === 'percentage') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 8h.01M16 12h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6-6" />
      </svg>
    );
  }
  if (type === 'free_shipping') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14v8a1 1 0 01-1 1H6a1 1 0 01-1-1V8zm0 0V6a1 1 0 011-1h6l3 3M7 19a2 2 0 110-4 2 2 0 010 4zm10 0a2 2 0 110-4 2 2 0 010 4z" />
      </svg>
    );
  }
  if (type === 'bogo') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  }
  // flat / default → rupee note
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5h8m-8 4h6a2.5 2.5 0 010 5H8m0 0l6 6" />
    </svg>
  );
}

function CopyIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ChevronDown({ className = 'w-3.5 h-3.5', open = false }) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function UsersIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

/* ── Usage counters (shown inside the Details expander) ── */

function CouponUsageBar({ coupon }) {
  const used = Number(coupon.used_count) || 0;
  const limit = Number(coupon.usage_limit) || 0;
  const isUnlimited = limit <= 0;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const barColor = isUnlimited ? '#2D6A4F' : pct >= 90 ? '#DC2626' : pct >= 70 ? '#D97706' : '#2D6A4F';

  return (
    <div className="mt-2.5">
      {/* Total usage + limit */}
      <div className="flex items-center justify-between text-[10px] text-konkan-text-secondary mb-1">
        <span className="font-semibold">{isUnlimited ? `${used} redeemed` : `${used} / ${limit} used`}</span>
        <span>{isUnlimited ? '♾ Unlimited usage' : `${pct}% claimed`}</span>
      </div>

      {/* Usage progress bar (hidden when unlimited) */}
      {!isUnlimited && (
        <div
          role="progressbar"
          aria-label={`${used} of ${limit} redemptions used`}
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(45,106,79,0.10)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Coupon card — 16px padding, 8px vertical rhythm, accent-matched actions ── */

export function CouponCard({ coupon, copiedCode, onCopy }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const style = getCouponStyle(coupon);
  const expiry = formatExpiry(coupon.valid_until);
  const usedToday = Number(coupon.used_today) || 0;

  return (
    <div className="bg-white rounded-2xl card overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        {/* Icon box — 40x40px, solid accent color per offer type, 20px white icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: style.color, color: '#FFFFFF' }}
        >
          <CouponIcon type={coupon.type} />
        </div>

        {/* Middle: category label / title / subtext / code / used-today / expiry */}
        <div className="flex-1 min-w-0">
          {/* Category label — uppercase, 0.5px letter-spacing, accent color */}
          <p
            className="text-[10px] font-bold uppercase"
            style={{ color: style.color, letterSpacing: '0.5px' }}
          >
            {style.label}
          </p>
          <h3 className="text-sm font-bold text-konkan-text-primary mt-2 leading-tight">{formatDiscount(coupon)}</h3>
          <p className="text-[11px] text-konkan-text-secondary mt-2">{formatMinOrder(coupon.min_order_amount)}</p>

          {/* Code pill with copy icon */}
          <button
            onClick={() => onCopy(coupon.code)}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed font-mono text-[11px] font-bold tracking-wider transition-colors"
            style={{ borderColor: style.color, color: style.color, backgroundColor: `${style.color}1A` }}
            aria-label={`Copy coupon code ${coupon.code}`}
          >
            {coupon.code}
            <CopyIcon className="w-3 h-3" />
          </button>

          {/* People used today — DB-driven used_today counter */}
          <p className="mt-2 flex items-center gap-1 text-[11px] text-konkan-text-secondary">
            <UsersIcon className="w-3.5 h-3.5" />
            {usedToday > 0 ? `${usedToday} ${usedToday === 1 ? 'person' : 'people'} used today` : 'No one used today yet'}
          </p>

          {expiry && <p className="text-[10px] text-konkan-text-secondary/70 mt-2">{expiry}</p>}
        </div>

        {/* Right: Copy button (accent color) + Details */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => onCopy(coupon.code)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white active:scale-95 transition-transform"
            style={{ backgroundColor: style.color }}
          >
            {copiedCode === coupon.code ? 'Copied ✓' : 'Copy'}
          </button>
          <button
            onClick={() => setDetailsOpen((v) => !v)}
            className="flex items-center gap-0.5 text-[10px] font-medium text-konkan-text-secondary hover:text-konkan-green-primary transition-colors"
          >
            Details <ChevronDown className="w-3 h-3" open={detailsOpen} />
          </button>
        </div>
      </div>

      {/* Expandable details — description + usage counters */}
      <div className={`transition-all duration-300 ease-out overflow-hidden ${detailsOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mx-4 px-1 pb-4 pt-2 border-t border-konkan-sand/50">
          <p className="text-xs text-konkan-text-secondary leading-relaxed">
            {coupon.description || 'Use this coupon at checkout to unlock your savings.'}
          </p>
          {coupon.max_discount > 0 && (
            <p className="text-[11px] text-konkan-text-secondary/70 mt-1">
              Max discount: ₹{Number(coupon.max_discount).toLocaleString('en-IN')}
            </p>
          )}
          <CouponUsageBar coupon={coupon} />
        </div>
      </div>
    </div>
  );
}

export function CouponSkeleton() {
  return (
    <div className="bg-white rounded-2xl card p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-2.5 w-20 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="skeleton h-8 w-16 rounded-lg shrink-0" />
    </div>
  );
}

/* ── Copy-to-clipboard hook (shared by offers page + coupons page) ── */

export function useCopyCoupon() {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = useCallback(async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  return { copiedCode, copyToClipboard };
}
