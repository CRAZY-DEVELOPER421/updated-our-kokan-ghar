import axios from 'axios';
import { getGuestId } from '@/lib/guest';

// Resolve the API base at RUNTIME so a single build works everywhere:
//  - storefront dev (:3000) / admin panel (:3001) → talk straight to the backend
//  - any other origin (ngrok tunnel/gateway)      → relative /api (gateway proxies it)
// This also makes builds immune to Git-Bash mangling build-time env paths.
function resolveApiBase() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
  const port = window.location.port;
  if (port === '3000' || port === '3001') return 'http://localhost:5000/api';
  return '/api';
}
const API_URL = resolveApiBase();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Device id — lets visitors keep a guest cart before signing up.
      // The backend ignores it when a JWT is present (logged-in cart wins).
      const guestId = getGuestId();
      if (guestId) {
        config.headers['X-Guest-Id'] = guestId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fired whenever ANY API call reveals the signed-in account is suspended.
// The SuspensionGate component listens for this and shows the friendly popup
// (+ route-guards the user back to the home page).
const dispatchSuspensionBlocked = (data) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('suspension:blocked', {
        detail: {
          message: data?.message || 'Your account has been suspended. Please contact support.',
          suspendUntil: data?.suspendUntil || null,
          permanent: !!data?.permanent,
        },
      })
    );
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // A suspended account is blocked on EVERY protected endpoint. Surface it
    // immediately via a global event (the gate shows the popup) so the user
    // gets a friendly explanation instead of random silent failures. The
    // LOGIN call is excluded — the login page shows its own suspension popup
    // and marks the store, so dispatching here would stack two modals. Silent
    // requests (background profile re-syncs) also skip the popup.
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'ACCOUNT_SUSPENDED' &&
      !(originalRequest.url || '').includes('/auth/login') &&
      !originalRequest.headers?.['X-Silent-Suspension']
    ) {
      dispatchSuspensionBlocked(error.response.data);
      return Promise.reject(error);
    }

    // Don't retry-refresh when the LOGIN call itself fails with 401 (wrong
    // password / OAuth-only account): there is no session to refresh yet, and
    // retrying would surface "Invalid refresh token." instead of the real
    // login error message.
    const isLoginCall = (originalRequest.url || '').includes('/auth/login');
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginCall) {
      originalRequest._retry = true;

      try {
        const refreshRes = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (refreshRes.data.success) {
          const newToken = refreshRes.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          // Refresh itself can be blocked by a suspension — show the friendly
          // popup instead of force-logging the user out / redirecting to login.
          // Honor the silent flag (background profile re-sync on page load
          // should not fire the popup even when its token refresh is blocked).
          if (
            refreshError.response?.status === 403 &&
            refreshError.response?.data?.code === 'ACCOUNT_SUSPENDED' &&
            !originalRequest.headers?.['X-Silent-Suspension']
          ) {
            dispatchSuspensionBlocked(refreshError.response.data);
            return Promise.reject(refreshError);
          }
          localStorage.removeItem('accessToken');
          localStorage.removeItem('konkan-admin-auth');
          window.dispatchEvent(new Event('auth:logout'));
          // Refresh token expired/absent — redirect to the storefront login
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const API_ROUTES = {
  // Auth
  register: '/auth/register',
  login: '/auth/login',
  logout: '/auth/logout',
  refreshToken: '/auth/refresh-token',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',

  // User
  profile: '/users/profile',
  changePassword: '/users/change-password',
  addresses: '/users/addresses',
  userNotifications: '/users/notifications',
  loyalty: '/users/loyalty',

  // Products
  products: '/products',
  featuredProducts: '/products/featured',
  bestsellers: '/products/bestsellers',
  seasonalProducts: '/products/seasonal',
  newArrivals: '/products/new-arrivals',

  // Categories
  categories: '/categories',

  // Cart
  cart: '/cart',
  cartItems: '/cart/items',
  applyCoupon: '/cart/apply-coupon',
  removeCoupon: '/cart/remove-coupon',

  // Wishlist
  wishlist: '/wishlist',

  // Orders
  orders: '/orders',
  createOrder: '/orders/create',

  // Payment
  createPaymentOrder: '/payment/create-order',
  verifyPayment: '/payment/verify',

  // Search
  search: '/search',
  searchSuggestions: '/search/suggestions',
  trending: '/search/trending',

  // Banners
  banners: '/banners',

  // Coupons
  coupons: '/coupons',

  // Notifications
  notifications: '/notifications',
};
