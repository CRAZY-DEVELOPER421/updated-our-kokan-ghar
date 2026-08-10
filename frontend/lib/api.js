import axios from 'axios';

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
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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
