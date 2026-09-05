'use client';

import { useState, useEffect, useMemo } from 'react';
import { Zap } from 'lucide-react';

/**
 * Dual-thumb price range slider with dynamic preset chips.
 * Two overlapping native range inputs styled as a single track with two thumbs.
 * Preset chips auto-generate based on the actual min/max price range from the DB,
 * so they always reflect real product data.
 */

const CURRENCY = '₹';

function formatPrice(val) {
  if (val >= 1000) {
    return `${CURRENCY}${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${CURRENCY}${val}`;
}

/** Generate smart preset ranges based on the actual price range. */
function generatePresets(rangeMin, rangeMax) {
  if (rangeMax <= 0) return [];

  const span = rangeMax - rangeMin;
  const presets = [];

  // Always include "Under X" as the first preset
  if (rangeMax > 200) {
    const under = Math.round(rangeMax * 0.15);
    presets.push({ label: `Under ${formatPrice(under)}`, min: rangeMin, max: under });
  }

  // Generate 3–4 middle presets that divide the range into useful buckets
  const steps = 3;
  const stepSize = span / steps;
  for (let i = 0; i < steps; i++) {
    const pMin = Math.round(rangeMin + stepSize * i);
    const pMax = Math.round(rangeMin + stepSize * (i + 1));
    // Skip if too close to the "Under" preset
    if (i === 0 && presets.length > 0 && pMax - rangeMin < span * 0.1) continue;
    presets.push({ label: `${formatPrice(pMin)}–${formatPrice(pMax)}`, min: pMin, max: pMax });
  }

  // "Above X" as the last preset
  if (rangeMax > 300) {
    const above = Math.round(rangeMin + span * 0.85);
    if (presets.length === 0 || above > presets[presets.length - 1].max) {
      presets.push({ label: `Above ${formatPrice(above)}`, min: above, max: rangeMax });
    }
  }

  return presets.slice(0, 5); // Cap at 5 chips
}

export default function PriceRangeSlider({
  min = 0,
  max = 5000,
  step = 10,
  value,
  onChange,
}) {
  const [minVal, setMinVal] = useState(Math.max(Number(value?.min) || min, min));
  const [maxVal, setMaxVal] = useState(Math.min(Number(value?.max) || max, max));

  useEffect(() => {
    setMinVal(Math.max(Number(value?.min) || min, min));
    setMaxVal(Math.min(Number(value?.max) || max, max));
  }, [value?.min, value?.max, min, max]);

  const presets = useMemo(() => generatePresets(min, max), [min, max]);

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

  const handlePreset = (preset) => {
    setMinVal(preset.min);
    setMaxVal(preset.max);
    onChange({ min: preset.min, max: preset.max });
  };

  const isPresetActive = (preset) => minVal === preset.min && maxVal === preset.max;
  const isFullRange = minVal === min && maxVal === max;

  const range = max - min || 1;
  const minPct = ((minVal - min) / range) * 100;
  const maxPct = ((maxVal - min) / range) * 100;

  return (
    <div className="pt-2 pb-1 select-none">
      {/* Preset chips */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {presets.map((preset) => {
            const active = isPresetActive(preset);
            return (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-150 ${
                  active
                    ? 'bg-konkan-green-primary text-white border-konkan-green-primary shadow-sm'
                    : 'bg-white text-konkan-text-secondary border-konkan-sand/70 hover:border-konkan-green-primary hover:text-konkan-green-primary'
                }`}
              >
                {active && <Zap className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />}
                {preset.label}
              </button>
            );
          })}
          {!isFullRange && (
            <button
              onClick={() => {
                setMinVal(min);
                setMaxVal(max);
                onChange({ min, max });
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-dashed border-konkan-saffron/50 text-konkan-saffron hover:bg-konkan-saffron/5 transition-all duration-150"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Dual-thumb slider track */}
      <div className="relative h-7">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-konkan-sand/40" />
        {/* Active fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-konkan-green-primary to-emerald-500 transition-all duration-75"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => handleMin(e.target.value)}
          aria-label="Minimum price"
          className="absolute left-0 top-0 w-full h-7 bg-transparent pointer-events-none range-thumb"
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
          className="absolute left-0 top-0 w-full h-7 bg-transparent pointer-events-none range-thumb"
          style={{ zIndex: maxVal > max - range * 0.5 ? 5 : 4 }}
        />
      </div>

      {/* Live min/max labels */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-semibold text-konkan-green-primary bg-konkan-cream/80 px-2.5 py-1 rounded-md tabular-nums">
          {CURRENCY}{minVal.toLocaleString('en-IN')}
        </span>
        <span className="text-[10px] text-konkan-text-secondary/50 uppercase tracking-wider font-medium">to</span>
        <span className="text-xs font-semibold text-konkan-green-primary bg-konkan-cream/80 px-2.5 py-1 rounded-md tabular-nums">
          {CURRENCY}{maxVal.toLocaleString('en-IN')}
        </span>
      </div>

      <style jsx>{`
        .range-thumb {
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
          pointer-events: auto;
        }
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
          width: 18px;
          height: 18px;
          margin-top: -8px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #1B6B3F;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(27, 107, 63, 0.1);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .range-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(27, 107, 63, 0.15);
        }
        .range-thumb::-webkit-slider-thumb:active {
          transform: scale(1.25);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(27, 107, 63, 0.2);
        }
        .range-thumb::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #1B6B3F;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
        .range-thumb::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
