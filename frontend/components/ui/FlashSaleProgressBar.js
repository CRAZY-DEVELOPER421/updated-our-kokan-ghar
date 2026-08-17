'use client';

// ── Flash Sale Progress Bar ("X% sold — sirf Y bache") ────────────────
// Urgency visual: shows sold_count / quantity_limit as a progress bar plus
// a "Only X left" line. Renders nothing when there is no meaningful limit.
// Used on flash-sale cards (homepage rows) and the product detail page.
export default function FlashSaleProgressBar({ soldCount = 0, quantityLimit = 0, compact = false }) {
  const sold = Number(soldCount) || 0;
  const limit = Number(quantityLimit) || 0;

  // No limit configured → nothing meaningful to show
  if (limit <= 0) return null;

  const soldPct = Math.min(Math.round((sold / limit) * 100), 100);
  const left = Math.max(limit - sold, 0);
  const almostGone = soldPct >= 70;

  return (
    <div className="w-full">
      {/* Labels */}
      <div className={`flex items-center justify-between ${compact ? 'mb-1' : 'mb-1.5'}`}>
        <span className={`font-semibold ${compact ? 'text-[10px]' : 'text-[11px]'}`} style={{ color: '#E53935' }}>
          {soldPct}% sold
        </span>
        <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-medium`} style={{ color: almostGone ? '#E53935' : '#8B6914' }}>
          {left > 0 ? `Only ${left} left` : 'Sold out!'}
        </span>
      </div>

      {/* Track */}
      <div className={`w-full rounded-full bg-red-100 overflow-hidden ${compact ? 'h-1.5' : 'h-2'}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${soldPct}%`,
            background: 'linear-gradient(90deg, #F5821F, #E53935)',
          }}
        />
      </div>
    </div>
  );
}
