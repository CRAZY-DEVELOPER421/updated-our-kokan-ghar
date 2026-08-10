import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Runtime-resolved API base — works on localhost dev AND behind the tunnel/gateway.
function resolveApiBase() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
  const port = window.location.port;
  if (port === '3000' || port === '3001') return 'http://localhost:5000/api';
  return '/api';
}
const API_URL = resolveApiBase();
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
