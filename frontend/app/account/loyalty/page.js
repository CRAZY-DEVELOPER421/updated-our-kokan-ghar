'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';

// Must mirror backend/services/loyalty.service.js TIER_THRESHOLDS
const TIERS = [
  { name: 'Bronze', min: 0, color: 'bg-amber-600', textColor: 'text-amber-600' },
  { name: 'Silver', min: 1000, color: 'bg-gray-400', textColor: 'text-gray-500' },
  { name: 'Gold', min: 5000, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { name: 'Platinum', min: 10000, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
];

const BENEFITS = {
  Bronze: ['Free standard delivery', 'Birthday surprise'],
  Silver: ['Free express delivery', 'Early access to sales', 'Double points on weekends'],
  Gold: ['Free premium delivery', 'Exclusive Gold-only deals', '3× points on all orders', 'Priority customer support'],
  Platinum: ['Free same-day delivery', 'Personal shopper', '5× points on all orders', 'VIP event invites', 'Exclusive Platinum gifts'],
};

export default function LoyaltyPage() {
  const { data: loyalty, isLoading } = useQuery({
    queryKey: ['loyalty'],
    queryFn: async () => {
      const res = await api.get('/users/loyalty');
      return res.data.data.loyalty || res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl card p-6 space-y-4">
          <Skeleton variant="heading" />
          <Skeleton variant="card" className="h-24" />
          <Skeleton variant="text" />
        </div>
        <div className="bg-white rounded-2xl card p-6 space-y-4">
          <Skeleton variant="heading" />
          <Skeleton variant="card" className="h-32" />
        </div>
      </div>
    );
  }

  const points = loyalty?.total_points || 0;
  const totalEarned = loyalty?.lifetime_earned || 0;
  const recentActivity = loyalty?.recent_activity || [];
  const history = recentActivity;
  const totalRedeemed = recentActivity
    .filter((e) => e.type === 'redeemed')
    .reduce((sum, e) => sum + Math.abs(e.points || 0), 0);

  // Tier thresholds must mirror backend/services/loyalty.service.js
  const currentTier = TIERS.reduce((prev, tier) => (points >= tier.min ? tier : prev), TIERS[0]);
  const nextTier = TIERS.find((t) => t.min > points);
  const nextTierMin = nextTier?.min || currentTier.min;
  const tierProgress = Math.min(100, ((points - currentTier.min) / Math.max(1, nextTierMin - currentTier.min)) * 100);
  const pointsToNext = nextTier ? nextTier.min - points : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Points Card */}
      <div className="bg-gradient-to-br from-konkan-green-dark via-konkan-green-primary to-konkan-green-secondary rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-konkan-green-pale/80 mb-1">Your Balance</p>
            <p className="font-display text-4xl md:text-5xl font-bold">{points}</p>
            <p className="text-sm text-konkan-green-pale/80 mt-1">Konkan Points</p>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-1 font-bold text-konkan-gold">{currentTier.name.charAt(0)}</div>
            <Badge variant="gold" className="text-xs">{currentTier.name}</Badge>
          </div>
        </div>

        {/* Tier Progress */}
        {nextTier ? (
          <div>
            <div className="flex items-center justify-between text-xs text-konkan-green-pale/80 mb-1.5">
              <span>{points} pts — {currentTier.name}</span>
              <span>{nextTier.min} pts — {nextTier.name}</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-konkan-gold to-yellow-300 transition-all duration-700"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="text-xs text-konkan-green-pale/80 mt-1.5">
              {pointsToNext} more points to reach {nextTier.name} tier!
            </p>
          </div>
        ) : (
          <p className="text-sm text-konkan-gold font-medium mt-2">You've reached the highest tier!</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Earned', value: totalEarned, color: 'text-konkan-saffron' },
          { label: 'Redeemed', value: totalRedeemed, color: 'text-konkan-green-primary' },
          { label: 'Available', value: points, color: 'text-konkan-ocean' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl card p-4 text-center">
            <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-konkan-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tier Benefits */}
      <div className="bg-white rounded-2xl card p-6">
        <h3 className="font-display font-bold text-konkan-text-primary mb-4">Tier Benefits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIERS.map((tier) => {
            const isCurrent = tier.name === currentTier.name;
            const isReached = points >= tier.min;
            return (
              <div key={tier.name} className={`p-4 rounded-xl border-2 transition-all ${
                isCurrent
                  ? 'border-konkan-saffron bg-konkan-saffron/5'
                  : isReached
                    ? 'border-konkan-green-primary bg-konkan-green-primary/5'
                    : 'border-konkan-sand bg-konkan-cream/30 opacity-60'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold text-lg ${tier.textColor}`}>{tier.name}</span>
                  {isCurrent && <Badge variant="accent" className="text-[10px]">Current</Badge>}
                </div>
                <ul className="space-y-1">
                  {BENEFITS[tier.name].map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-konkan-text-secondary">
                      <svg className="w-3 h-3 text-konkan-success mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-konkan-text-secondary mt-2">{tier.min} points required</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Points History */}
      <div className="bg-white rounded-2xl card p-6">
        <h3 className="font-display font-bold text-konkan-text-primary mb-4">Points History</h3>
        {history.length === 0 ? (            <div className="text-center py-6">
            <p className="text-sm text-konkan-text-secondary">No points activity yet. Start shopping to earn points!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry, idx) => (
              <div key={entry.id || idx} className="flex items-center justify-between py-2 border-b border-konkan-sand/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    entry.type === 'earned' ? 'bg-konkan-success/10' : 'bg-konkan-error/10'
                  }`}>
                    {entry.type === 'earned' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-konkan-text-primary">{entry.reason || entry.description || 'Points update'}</p>
                    <p className="text-xs text-konkan-text-secondary">
                      {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${entry.type === 'earned' ? 'text-konkan-success' : 'text-konkan-error'}`}>
                  {entry.type === 'earned' ? '+' : '-'}{entry.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
