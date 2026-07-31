'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate, onComplete, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = Math.max(0, target - now);

      if (diff === 0) {
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculate());

    const interval = setInterval(() => {
      const remaining = calculate();
      setTimeLeft(remaining);
      if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (!timeLeft) return null;

  const pad = (num) => String(num).padStart(2, '0');

  if (compact) {
    const totalHours = timeLeft.days * 24 + timeLeft.hours;
    return (
      <span className="font-mono font-bold text-konkan-saffron">
        {pad(totalHours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    );
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: pad(timeLeft.hours) },
    { label: 'Mins', value: pad(timeLeft.minutes) },
    { label: 'Secs', value: pad(timeLeft.seconds) },
  ];

  return (
    <div className="flex items-start gap-0 flex-nowrap">
      {units.map((unit, idx) => (
        <div key={unit.label} className="flex items-start">
          <div className="flex flex-col items-center min-w-[48px] md:min-w-[54px]">
            <div className="relative bg-konkan-earth/90 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 text-center w-full">
              <div className="absolute inset-x-2 top-1/2 h-px bg-black/15" />
              <span className="font-mono text-lg md:text-xl font-bold text-white relative z-10 leading-none">
                {unit.value}
              </span>
            </div>
            <span className="text-[10px] text-white/70 mt-1 uppercase tracking-wider whitespace-nowrap">
              {unit.label}
            </span>
          </div>
          {idx < units.length - 1 && (
            <span className="text-white/40 font-bold text-lg md:text-xl px-1 md:px-1.5 leading-none mt-[10px] md:mt-[13px]">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
