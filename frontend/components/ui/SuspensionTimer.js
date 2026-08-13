'use client';

import { useState, useEffect } from 'react';

/**
 * Live countdown to a suspension expiry date.
 *
 * - `until`  : ISO date string (suspendUntil) — required
 * - `onExpire`: fired once when the countdown reaches zero (backend auto-
 *               reactivates, so callers can clear the suspended state)
 * - `compact` : single-line "2d 04:12:33" vs. boxed unit tiles
 * - `variant` : 'light' (white text, for dark banners) or 'dark' (default)
 */
export default function SuspensionTimer({ until, onExpire, compact = true, variant = 'dark' }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!until) return;
    const target = new Date(until).getTime();
    if (Number.isNaN(target)) return;

    const calculate = () => {
      const diff = Math.max(0, target - Date.now());

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        diff,
      };
    };

    setTimeLeft(calculate());

    const interval = setInterval(() => {
      const remaining = calculate();
      setTimeLeft(remaining);
      if (remaining.diff === 0 && !expired) {
        setExpired(true);
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [until]);

  if (!until || Number.isNaN(new Date(until).getTime())) return null;
  if (!timeLeft) return null;

  const pad = (num) => String(num).padStart(2, '0');
  const totalHours = timeLeft.days * 24 + timeLeft.hours;

  if (compact) {
    const color = variant === 'light' ? 'text-white' : 'text-konkan-saffron';
    const label = variant === 'light' ? 'text-white/80' : 'text-konkan-text-secondary';
    return (
      <span className="inline-flex items-baseline gap-1" title="Time remaining in suspension">
        <span className={`font-mono font-bold tabular-nums ${color}`}>
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {pad(totalHours % 24)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
        {timeLeft.days > 0 && (
          <span className={`text-[10px] font-medium ${label}`}>left</span>
        )}
      </span>
    );
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: pad(timeLeft.hours) },
    { label: 'Mins', value: pad(timeLeft.minutes) },
    { label: 'Secs', value: pad(timeLeft.seconds) },
  ];
  const tileBg = variant === 'light' ? 'bg-white/15' : 'bg-konkan-earth/90';
  const tileText = variant === 'light' ? 'text-white' : 'text-white';
  const unitLabel = variant === 'light' ? 'text-white/70' : 'text-konkan-text-secondary';

  return (
    <div className="flex items-start gap-0 flex-nowrap">
      {units.map((unit, idx) => (
        <div key={unit.label} className="flex items-start">
          <div className="flex flex-col items-center min-w-[46px] md:min-w-[52px]">
            <div className={`relative ${tileBg} rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 text-center w-full`}>
              <div className="absolute inset-x-2 top-1/2 h-px bg-black/15" />
              <span className={`font-mono text-base md:text-lg font-bold ${tileText} relative z-10 leading-none`}>
                {unit.value}
              </span>
            </div>
            <span className={`text-[10px] ${unitLabel} mt-1 uppercase tracking-wider whitespace-nowrap`}>
              {unit.label}
            </span>
          </div>
          {idx < units.length - 1 && (
            <span className={`font-bold text-base md:text-lg px-1 leading-none mt-[10px] ${unitLabel}`}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}
