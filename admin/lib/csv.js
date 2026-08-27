import api from './api';

/**
 * Download a CSV export from the admin API.
 * @param {string} endpoint - e.g. '/export/orders'
 * @param {string} filename - fallback filename if Content-Disposition is missing
 * @param {Object} params - optional query params (status, from, to, etc.)
 */
export async function downloadCSV(endpoint, filename, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${endpoint}${qs ? '?' + qs : ''}`;

  const res = await api.get(url, { responseType: 'blob' });

  // Try to extract filename from Content-Disposition header
  const disposition = res.headers['content-disposition'];
  let downloadName = filename;
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) downloadName = match[1];
  }

  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
