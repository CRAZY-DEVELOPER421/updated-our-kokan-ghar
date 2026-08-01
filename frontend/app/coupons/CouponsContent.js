'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { CouponCard, CouponSkeleton, useCopyCoupon } from '@/components/coupon/CouponCard';

export default function CouponsContent() {
  const { copiedCode, copyToClipboard } = useCopyCoupon();

  // Full coupons list — DB-driven via GET /api/coupons (all active coupons, no slice)
  const { data, isLoading } = useQuery({
    queryKey: ['all-coupons'],
    queryFn: async () => {
      const res = await api.get('/coupons');
      return res.data.data;
    },
    staleTime: 60000,
  });
  const coupons = data?.coupons || [];

  return (
    <div className="animate-fade-in bg-white">
      {/* Header */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-konkan-text-primary">All Coupons</h1>
            <p className="text-xs text-konkan-text-secondary mt-1">
              {coupons.length > 0
                ? `${coupons.length} active ${coupons.length === 1 ? 'coupon' : 'coupons'} — tap Copy to grab a code`
                : 'Browse every active promo code'}
            </p>
          </div>
          <Link
            href="/offers"
            className="flex items-center gap-1 text-xs font-semibold text-konkan-green-primary hover:text-konkan-green-dark transition-colors shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Offers
          </Link>
        </div>
      </div>

      {/* Coupons list */}
      <div className="px-4 mt-3 space-y-3 pb-6">
        {isLoading ? (
          <>
            <CouponSkeleton />
            <CouponSkeleton />
            <CouponSkeleton />
          </>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-2xl card border border-dashed border-konkan-sand px-4 py-8 text-center">
            <p className="text-xs text-konkan-text-secondary">No active coupons right now — check back soon!</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <CouponCard key={coupon.code} coupon={coupon} copiedCode={copiedCode} onCopy={copyToClipboard} />
          ))
        )}
      </div>
    </div>
  );
}
