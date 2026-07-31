'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');

    setLoading(true);
    try {
      // Simulate subscription — backend should have /api/subscribers endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Welcome! Use code FRESH100 for ₹100 off your first order!');
      setEmail('');
      setName('');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-konkan-green-primary to-konkan-green-dark p-8 md:p-12">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-konkan-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-xl mx-auto text-center">
        <div className="mb-4 flex justify-center"><svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg></div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
          Get ₹100 Off Your First Order!
        </h2>
        <p className="text-white/80 text-sm md:text-base mb-6">
          Subscribe to our newsletter and receive exclusive offers, seasonal updates, and authentic Konkan recipes straight to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
            </div>
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-konkan-gold text-konkan-earth font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {loading ? 'Subscribing...' : 'Subscribe & Get ₹100 Off'}
          </button>
        </form>

        <p className="text-white/50 text-xs mt-4">
          No spam. Unsubscribe anytime. By subscribing, you agree to our Privacy Policy.
        </p>
      </div>
    </section>
  );
}
