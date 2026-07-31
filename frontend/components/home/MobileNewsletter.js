'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function MobileNewsletter() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubscribing(true);
    // Simulate subscription — replace with actual API call
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Subscribed! Check your inbox for 10% off.');
    setEmail('');
    setIsSubscribing(false);
  };

  return (
    <div
      style={{
        backgroundColor: '#1B3B2F',
        margin: '8px 16px',
        borderRadius: '12px',
        padding: '24px 20px',
        textAlign: 'center',
      }}
    >
      <h3
        className="font-bold"
        style={{
          fontSize: '18px',
          color: '#FFFFFF',
        }}
      >
        Get 10% Off Your First Order!
      </h3>
      <p
        className="mx-auto mt-1.5"
        style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.8)',
          maxWidth: '90%',
        }}
      >
        Subscribe to our newsletter and get exclusive deals, recipes, and Konkan stories straight to your inbox.
      </p>

      <form onSubmit={handleSubscribe} className="flex flex-row gap-2 mt-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 min-w-0 rounded-lg outline-none"
          style={{
            height: '44px',
            padding: '0 16px',
            backgroundColor: '#FFFFFF',
            color: '#1A1A1A',
            fontSize: '14px',
            borderRadius: '8px',
            border: 'none',
          }}
          suppressHydrationWarning
        />
        <button
          type="submit"
          disabled={isSubscribing}
          className="shrink-0 font-semibold transition-colors disabled:opacity-60 active:scale-[0.98]"
          style={{
            height: '44px',
            backgroundColor: '#F5821F',
            color: '#FFFFFF',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '0 20px',
          }}
          suppressHydrationWarning
        >
          {isSubscribing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Subscribing...
            </span>
          ) : (
            'Subscribe'
          )}
        </button>
      </form>
    </div>
  );
}
