/**
 * Slab Discount (Buy More, Save More)
 *
 * Cart page / checkout show tiered discounts based on the item subtotal:
 *   ₹0 – ₹999      → no discount
 *   ₹1,000+        → 5%
 *   ₹2,000+        → 10%
 *   ₹3,000+        → 15%
 *
 * The discount is computed on the SUBTOTAL (before coupon) and capped so it
 * never pushes the payable item amount (subtotal − coupon) below ₹0 —
 * shipping & GST always remain payable. The SAME function drives the cart
 * summary (GET /cart) and order creation (POST /orders/create), so the total
 * the customer sees on the cart page is always the total that gets charged.
 */
const computeSlabDiscount = (subtotal, couponDiscount = 0) => {
  const s = Number(subtotal) || 0;
  const coupon = Number(couponDiscount) || 0;

  let percent = 0;
  if (s >= 3000) percent = 15;
  else if (s >= 2000) percent = 10;
  else if (s >= 1000) percent = 5;

  // Round to whole rupees — mirrors the classic cart-page behaviour
  // (Math.round(subtotal * percent / 100)).
  const gross = Math.round((s * percent) / 100);
  const discount = Math.min(gross, Math.max(s - coupon, 0));

  return { percent, discount };
};

module.exports = { computeSlabDiscount };
