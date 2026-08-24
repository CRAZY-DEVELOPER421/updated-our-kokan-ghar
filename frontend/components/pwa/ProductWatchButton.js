'use client';

import { useState, useEffect } from 'react';

/**
 * Product Watch Button
 * 
 * Lets users "watch" a product for price drops.
 * When the price drops, they get a push notification.
 * 
 * Props:
 *   - productId: number (required)
 *   - className: string (optional)
 */
export default function ProductWatchButton({ productId, className = '' }) {
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!productId) return;

    // Check if user is logged in and watching
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      setChecked(true);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/push/watch/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setWatching(data.data.watching);
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [productId]);

  const toggleWatch = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to watch for price drops.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/push/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setWatching(data.data.watching);
      }
    } catch (err) {
      console.error('Watch toggle failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!checked) return null;

  return (
    <button
      onClick={toggleWatch}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
        watching
          ? 'text-amber-600 hover:text-amber-700'
          : 'text-gray-500 hover:text-amber-600'
      } ${loading ? 'opacity-50' : ''} ${className}`}
      title={watching ? 'Stop watching for price drops' : 'Watch for price drops'}
    >
      <span className="text-base">{watching ? '👁️' : '👁️‍🗨️'}</span>
      <span>{watching ? 'Watching' : 'Watch Price'}</span>
    </button>
  );
}
