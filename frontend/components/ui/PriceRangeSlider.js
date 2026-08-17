'use client';

import { useState, useEffect } from 'react';

/**
 * Dual-thumb price range slider.
 * Two overlapping native range inputs styled as a single track with two thumbs.
 * The thumb + ₹ labels track the drag in real time via internal state (smooth,
 * no lag); the parent decides when to actually apply the filter (debounced).
 */
export default function PriceRangeSlider({
  min = 0,
  max = 5000,
  step = 10,
  value,
  onChange,
}) {
  // Internal state = source of truth while dragging, so the thumb follows the
  // mouse instantly. Re-syncs whenever the URL value (prop) changes.
  const [minVal, setMinVal] = useState(Math.max(Number(value?.min) || min, min));
  const [maxVal, setMaxVal] = useState(Math.min(Number(value?.max) || max, max));

  useEffect(() => {
    setMinVal(Math.max(Number(value?.min) || min, min));
    setMaxVal(Math.min(Number(value?.max) || max, max));
  }, [value?.min, value?.max, min, max]);

  const handleMin = (v) => {
    const next = Math.min(Number(v), maxVal - step);
    setMinVal(next);
    onChange({ min: next, max: maxVal });
  };

  const handleMax = (v) => {
    const next = Math.max(Number(v), minVal + step);
    setMaxVal(next);
    onChange({ min: minVal, max: next });
  };

  const range = max - min || 1;
  const minPct = ((minVal - min) / range) * 100;
  const maxPct = ((maxVal - min) / range) * 100;

  return (
    <div className="pt-3 pb-1 select-none">
      {/* Thumbs (in flow) + track drawn absolutely at the thumb center line.
          Input track is hidden (height 0), so the thumb circle centers on the
          container's middle — exactly where the bar sits. No offset issues. */}
      <div className="relative h-6">
        {/* Visual track + green fill — centered on the thumb line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-konkan-sand/60">
          <div
            className="absolute h-1.5 rounded-full bg-konkan-green-primary"
            style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => handleMin(e.target.value)}
          aria-label="Minimum price"
          className="absolute left-0 top-0 w-full h-6 bg-transparent pointer-events-none range-thumb"
          style={{ zIndex: minVal > max - range * 0.5 ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => handleMax(e.target.value)}
          aria-label="Maximum price"
          className="absolute left-0 top-0 w-full h-6 bg-transparent pointer-events-none range-thumb"
          style={{ zIndex: maxVal > max - range * 0.5 ? 5 : 4 }}
        />
      </div>

      {/* Live labels */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs font-semibold text-konkan-green-primary bg-konkan-cream px-2 py-0.5 rounded-md tabular-nums">
          ₹{minVal}
        </span>
        <span className="text-[11px] text-konkan-text-secondary/60">to</span>
        <span className="text-xs font-semibold text-konkan-green-primary bg-konkan-cream px-2 py-0.5 rounded-md tabular-nums">
          ₹{maxVal}
        </span>
      </div>

      <style jsx>{`
        .range-thumb {
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
          pointer-events: auto;
        }
        /* Hide the native input track so the thumb sits exactly on our bar */
        .range-thumb::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          appearance: none;
          height: 0;
          background: transparent;
        }
        .range-thumb::-moz-range-track {
          height: 0;
          background: transparent;
        }
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          margin-top: 0;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #1B6B3F;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        }
        .range-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #1B6B3F;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
