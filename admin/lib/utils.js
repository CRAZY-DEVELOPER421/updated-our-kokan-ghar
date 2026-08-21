import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api$/, '');

/**
 * Resolves relative image URLs (e.g. /uploads/abc.jpg) to the backend origin.
 * Returns absolute URLs as-is; returns null for null/undefined input.
 */
export function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}

/**
 * Builds an absolute URL on the STOREFRONT (port 3000 / tunnel root), even
 * though this code runs in the admin panel (port 3001 / /admin basePath).
 *  - localhost dev: admin on :3001 → storefront on :3000
 *  - tunneled: same origin, storefront at root, admin under /admin
 */
export function getStorefrontUrl(path = '/') {
  if (typeof window === 'undefined') return `http://localhost:3000${path}`;
  const port = window.location.port;
  if (port === '3001') return `http://localhost:3000${path}`;
  // Tunneled/gateway: admin lives under /admin on the same origin as the
  // storefront (which sits at the root) — so just use this origin.
  return `${window.location.origin}${path}`;
}
