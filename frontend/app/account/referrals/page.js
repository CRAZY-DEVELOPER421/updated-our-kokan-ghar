'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const res = await api.get('/users/referrals');
      return res.data.data;
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

  const code = data?.code || '';
  const rewardAmount = data?.reward_amount || 50;
  const summary = data?.summary || { total_referred: 0, rewarded: 0, pending: 0, total_reward_coins: 0 };
  const referrals = data?.referrals || [];

  // Build the absolute share URL from the current origin so it works on
  // localhost, the tunnel, and the production domain alike.
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/signup?ref=${code}`
    : `/signup?ref=${code}`;

  const shareText = `I'm shopping at Kokan Ghar (Konkan Bazaar) — authentic Konkan products! Use my code ${code} when you sign up and we BOTH get ${rewardAmount} Konkan Coins. Shop here: ${shareUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const shareEmail = () => {
    window.open(
      `mailto:?subject=${encodeURIComponent('Shop at Kokan Ghar — get Konkan Coins!')}&body=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-konkan-green-dark via-konkan-green-primary to-konkan-green-secondary rounded-2xl p-6 md:p-8 text-white">
        <p className="text-sm text-konkan-green-pale/80 mb-1">Refer &amp; Earn</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Give {rewardAmount} Coins, Get {rewardAmount} Coins
        </h2>
        <p className="text-sm text-konkan-green-pale/80 max-w-xl">
          Share your personal code with friends. When they sign up using it, you both instantly
          get <span className="font-semibold text-konkan-gold">{rewardAmount} Konkan Coins</span>.
        </p>

        {/* Personal code */}
        <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4 md:p-5">
          <p className="text-xs uppercase tracking-wide text-konkan-green-pale/70 mb-2">Your referral code</p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-2xl md:text-3xl font-bold tracking-widest">{code || '—'}</span>
            <button
              onClick={() => {
                if (!code) return;
                try { navigator.clipboard.writeText(code); toast.success('Code copied!'); }
                catch { toast.error('Could not copy code'); }
              }}
              className="text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 font-medium transition-colors"
            >
              Copy Code
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Button size="sm" variant="secondary" className="!bg-white !text-konkan-green-dark hover:!bg-konkan-cream" onClick={copyLink}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </Button>
          <Button size="sm" variant="secondary" className="!bg-[#25D366] !text-white hover:!bg-[#1eb858]" onClick={shareWhatsApp}>
            Share on WhatsApp
          </Button>
          <Button size="sm" variant="secondary" className="!bg-white !text-konkan-green-dark hover:!bg-konkan-cream" onClick={shareEmail}>
            Share via Email
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Friends Referred', value: summary.total_referred, color: 'text-konkan-ocean' },
          { label: 'Rewarded', value: summary.rewarded, color: 'text-konkan-success' },
          { label: 'Pending', value: summary.pending, color: 'text-konkan-saffron' },
          { label: 'Coins Earned', value: summary.total_reward_coins, color: 'text-konkan-green-primary' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl card p-4 text-center">
            <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-konkan-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl card p-6">
        <h3 className="font-display font-bold text-konkan-text-primary mb-4">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share your code', desc: 'Send your personal code or link to friends on WhatsApp, email or anywhere.' },
            { step: '2', title: 'Friend signs up', desc: 'They enter your code at signup (or click your link — it fills in automatically).' },
            { step: '3', title: 'Both earn coins', desc: `You and your friend each get ${rewardAmount} Konkan Coins, instantly credited.` },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-konkan-green-primary/10 text-konkan-green-primary flex items-center justify-center font-bold shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-medium text-konkan-text-primary">{s.title}</p>
                <p className="text-xs text-konkan-text-secondary mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-konkan-text-secondary mt-4">
          Fair-play note: one phone number = one account. A phone number that is already registered
          cannot create another account, so earning coins through multiple accounts is not possible.
        </p>
      </div>

      {/* Referred friends list */}
      <div className="bg-white rounded-2xl card p-6">
        <h3 className="font-display font-bold text-konkan-text-primary mb-4">Your Referrals</h3>
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-14 h-14 rounded-full bg-konkan-cream border border-konkan-sand flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="text-sm text-konkan-text-secondary">No referrals yet</p>
            <p className="text-xs text-konkan-text-secondary mt-1 mb-4">Share your code and start earning coins!</p>
            <Button size="sm" onClick={copyLink}>{copied ? '✓ Copied!' : 'Copy Your Referral Link'}</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between py-2.5 border-b border-konkan-sand/30 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-konkan-green-primary/10 text-konkan-green-primary flex items-center justify-center font-bold shrink-0">
                    {(ref.referred_name || 'F')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-konkan-text-primary truncate">{ref.referred_name || 'Friend'}</p>
                    <p className="text-xs text-konkan-text-secondary truncate">
                      {ref.referred_email}
                      {' · '}
                      {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {Number(ref.reward_given) === 1 ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-konkan-success/10 text-konkan-success">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      +{rewardAmount} Coins
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-konkan-saffron/10 text-konkan-saffron">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <Link href="/account/loyalty" className="text-sm text-konkan-green-primary font-medium hover:underline">
          View your Konkan Coins &amp; Rewards →
        </Link>
      </div>
    </div>
  );
}
