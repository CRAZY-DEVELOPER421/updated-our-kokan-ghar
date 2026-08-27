/**
 * Google Analytics 4 — Full E-commerce & Consent Mode v2 helper
 *
 * Docs:
 *  - E-commerce: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 *  - Consent Mode: https://developers.google.com/tag-platform/security/guides/consent
 *  - User Properties: https://developers.google.com/analytics/devguides/collection/ga4/user-properties
 *  - Enhanced Conversions: https://developers.google.com/tag-platform/security/guides/consent/improve-conversions
 */

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/* ────────────────────────────────────────────────────────
   1. CORE — gtag wrapper (no-ops when GA ID is missing)
   ──────────────────────────────────────────────────────── */

export function gtag(...args) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  window.gtag?.(...args);
}

export function trackPageView(url) {
  gtag('event', 'page_view', { page_path: url });
}

/* ────────────────────────────────────────────────────────
   2. CONSENT MODE v2
   ──────────────────────────────────────────────────────── */

/** Default consent — called once before gtag init in layout.js */
export function getConsentDefaults() {
  return {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted', // always allowed (cookie consent banner, etc.)
    wait_for_update: 500, // ms — wait for CMP before firing
  };
}

/** Called when user grants consent via the cookie banner */
export function grantConsent() {
  gtag('consent', 'update', {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('ga4_consent', 'granted');
  }
}

/** Called when user rejects non-essential cookies */
export function rejectConsent() {
  gtag('consent', 'update', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('ga4_consent', 'rejected');
  }
}

/** Check if consent was previously given */
export function hasConsent() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('ga4_consent') === 'granted';
}

/* ────────────────────────────────────────────────────────
   3. ENHANCED CONVERSIONS — hash user data before sending
   ──────────────────────────────────────────────────────── */

/** SHA-256 hash for Enhanced Conversions (Web Crypto API) */
async function sha256(message) {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return '';
  const msgBuffer = new TextEncoder().encode(message.trim().toLowerCase());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Build enhanced conversion user_data from auth user */
export async function buildEnhancedConversion(user) {
  if (!user) return {};
  const data = {};
  if (user.email) {
    data.email = await sha256(user.email);
  }
  if (user.phone) {
    data.phone_number = await sha256(user.phone.replace(/\D/g, ''));
  }
  if (user.name) {
    const parts = user.name.split(' ');
    data.first_name = await sha256(parts[0] || '');
    if (parts.length > 1) {
      data.last_name = await sha256(parts.slice(1).join(' '));
    }
  }
  return data;
}

/* ────────────────────────────────────────────────────────
   4. USER PROPERTIES
   ──────────────────────────────────────────────────────── */

/**
 * Set user properties after login / profile fetch.
 * call this from authStore after successful login.
 */
export async function setGAUserProperties(user, loyalty = null) {
  if (!user) return;

  const props = {
    user_id: String(user.id),
    user_type: 'registered',
  };

  if (loyalty) {
    props.loyalty_points = String(loyalty.total_points || 0);
    props.loyalty_tier = loyalty.tier || 'bronze';
  }

  gtag('set', props);

  // Also set Enhanced Conversions data via user_data
  const enhancedData = await buildEnhancedConversion(user);
  if (Object.keys(enhancedData).length > 0) {
    gtag('set', { user_data: enhancedData });
  }
}

/** Clear user properties on logout */
export function clearGAUserProperties() {
  gtag('set', {
    user_id: undefined,
    user_type: 'guest',
    loyalty_points: undefined,
    loyalty_tier: undefined,
  });
}

/* ────────────────────────────────────────────────────────
   5. E-COMMERCE EVENTS — FULL SUITE
   ──────────────────────────────────────────────────────── */

/** Helper: normalise a product into GA4 item format */
function toGA4Item(product, opts = {}) {
  return {
    item_id: String(product.id || product.product_id || ''),
    item_name: product.name || product.product_name || '',
    affiliation: 'Kokan Ghar',
    coupon: opts.coupon || product.coupon || undefined,
    category: product.category_name || product.category || '',
    category_id: String(product.category_id || ''),
    brand: product.brand || 'Konkan Ghar',
    variant: product.variant_value || product.variant_name || undefined,
    price: Number(product.price) || 0,
    quantity: Number(opts.quantity || product.quantity) || 1,
    discount: Number(product.discount_percent || opts.discount) || undefined,
    index: opts.index,
  };
}

// ─── view_item — product detail page ───
export function trackViewItem(product) {
  gtag('event', 'view_item', {
    currency: 'INR',
    value: Number(product.price) || 0,
    items: [toGA4Item(product)],
  });
}

// ─── add_to_cart — "Add to Cart" / "Buy Now" button ───
export function trackAddToCart(product, quantity = 1) {
  gtag('event', 'add_to_cart', {
    currency: 'INR',
    value: (Number(product.price) || 0) * quantity,
    items: [toGA4Item(product, { quantity })],
  });
}

// ─── remove_from_cart — cart item remove ───
export function trackRemoveFromCart(product, quantity = 1) {
  gtag('event', 'remove_from_cart', {
    currency: 'INR',
    value: (Number(product.price) || 0) * quantity,
    items: [toGA4Item(product, { quantity })],
  });
}

// ─── view_cart — cart page load ───
export function trackViewCart(cartItems = [], totalValue = 0) {
  gtag('event', 'view_cart', {
    currency: 'INR',
    value: totalValue,
    items: cartItems.map((item, i) => toGA4Item(item, { index: i })),
  });
}

// ─── begin_checkout — checkout page load ───
export function trackBeginCheckout(cartItems = [], totalValue = 0, coupon = null) {
  gtag('event', 'begin_checkout', {
    currency: 'INR',
    value: totalValue,
    coupon: coupon || undefined,
    items: cartItems.map((item, i) => toGA4Item(item, { index: i, coupon })),
  });
}

// ─── add_shipping_info — address step complete ───
export function trackAddShippingInfo(cartItems = [], totalValue = 0, shippingTier = 'Standard') {
  gtag('event', 'add_shipping_info', {
    currency: 'INR',
    value: totalValue,
    shipping_tier: shippingTier,
    items: cartItems.map((item, i) => toGA4Item(item, { index: i })),
  });
}

// ─── add_payment_info — payment method selected ───
export function trackAddPaymentInfo(cartItems = [], totalValue = 0, paymentType = 'online') {
  gtag('event', 'add_payment_info', {
    currency: 'INR',
    value: totalValue,
    payment_type: paymentType,
    items: cartItems.map((item, i) => toGA4Item(item, { index: i })),
  });
}

// ─── purchase — order success (deduped via sessionStorage) ───
export function trackPurchase(orderId, totalValue, items = [], opts = {}) {
  if (typeof window === 'undefined') return;

  const flagKey = `ga4_purchase_${orderId}`;
  if (sessionStorage.getItem(flagKey)) return;
  sessionStorage.setItem(flagKey, '1');

  gtag('event', 'purchase', {
    transaction_id: orderId,
    value: totalValue,
    tax: Number(opts.tax) || 0,
    shipping: Number(opts.shipping) || 0,
    currency: 'INR',
    coupon: opts.coupon || undefined,
    payment_type: opts.paymentType || undefined,
    items: items.map((item, i) => toGA4Item(item, { index: i })),
  });
}

// ─── view_item_list — category / PLP page ───
export function trackViewItemList(items = [], listName = '', listId = '') {
  if (!items.length) return;
  gtag('event', 'view_item_list', {
    item_list_id: listId,
    item_list_name: listName,
    items: items.map((item, i) => toGA4Item(item, { index: i })),
  });
}

// ─── select_item — product card click ───
export function trackSelectItem(product, listName = '', listId = '', index = 0) {
  gtag('event', 'select_item', {
    item_list_id: listId,
    item_list_name: listName,
    items: [toGA4Item(product, { index })],
  });
}

// ─── view_search_results — search results page ───
export function trackViewSearchResults(query, items = []) {
  gtag('event', 'view_search_results', {
    search_term: query,
    items: items.map((item, i) => toGA4Item(item, { index: i })),
  });
}

// ─── search — when user performs a search ───
export function trackSearch(query) {
  gtag('event', 'search', {
    search_term: query,
  });
}

// ─── add_to_wishlist ───
export function trackAddToWishlist(product) {
  gtag('event', 'add_to_wishlist', {
    currency: 'INR',
    value: Number(product.price) || 0,
    items: [toGA4Item(product)],
  });
}

// ─── remove_from_wishlist ───
export function trackRemoveFromWishlist(product) {
  gtag('event', 'remove_from_wishlist', {
    currency: 'INR',
    value: Number(product.price) || 0,
    items: [toGA4Item(product)],
  });
}

// ─── select_promotion — banner / slider click ───
export function trackSelectPromotion(promotionId, promotionName, creativeName = '') {
  gtag('event', 'select_promotion', {
    promotion_id: String(promotionId),
    promotion_name: promotionName,
    creative_name: creativeName,
    creative_slot: creativeName,
  });
}

// ─── view_promotion — banner / slider impression ───
export function trackViewPromotion(promotionId, promotionName, creativeName = '') {
  gtag('event', 'view_promotion', {
    promotion_id: String(promotionId),
    promotion_name: promotionName,
    creative_name: creativeName,
    creative_slot: creativeName,
  });
}

/* ────────────────────────────────────────────────────────
   6. SCROLL DEPTH — track 25/50/75/90% scroll
   ──────────────────────────────────────────────────────── */

const _scrollTracked = new Set();
export function trackScrollDepth() {
  if (typeof window === 'undefined') return;

  const marks = [25, 50, 75, 90];
  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    marks.forEach((mark) => {
      if (pct >= mark && !_scrollTracked.has(mark)) {
        _scrollTracked.add(mark);
        gtag('event', 'scroll', {
          percent_scrolled: mark,
        });
      }
    });
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}
