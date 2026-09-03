import axios from 'axios';

// Resolve the API base at RUNTIME so a single build works everywhere:
//  - admin dev (:3001)                        → talk straight to the backend
//  - any other origin (ngrok tunnel/gateway)   → relative /api (gateway proxies it)
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

// ⚠️ Do NOT set a default Content-Type header here — axios auto-detects
// FormData vs JSON and sets the correct Content-Type + boundary
// automatically. Setting 'application/json' as default breaks multipart
// uploads (hero images, product images, CSV imports, etc.) because
// the browser sends JSON Content-Type instead of multipart/form-data.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh on the login request itself — a 401 here means a
    // wrong password, and attempting a refresh would swallow the real error
    // message and surface the refresh failure instead.
    const isLoginRequest = originalRequest?.url?.includes('/admin/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
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
          localStorage.removeItem('accessToken');
          localStorage.removeItem('konkan-admin-auth');
          window.dispatchEvent(new Event('auth:logout'));
          // Redirect to admin login. This is a HARD browser redirect (not
          // next/navigation), so it must include the /admin basePath — otherwise
          // it lands on localhost:3001/login and 404s.
          const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '';
          if (window.location.pathname !== `${basePath}/login`) {
            window.location.href = `${basePath}/login`;
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
