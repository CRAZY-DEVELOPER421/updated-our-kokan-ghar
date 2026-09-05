'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Image search hook — sends image to backend, gets visually similar products.
 *
 * Flow: image file → FormData upload → backend computes color histogram
 *       → compares with pre-computed product fingerprints → returns ranked results
 */
export default function useImageSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null); // { products: [...], total, query_type }
  const [error, setError] = useState(null);

  const searchByImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return null;
    }

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/search/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30s timeout for image processing
      });

      if (res.data.success) {
        const data = res.data.data;
        setResults(data);
        return data;
      } else {
        setError(res.data.message || 'Image search failed.');
        return null;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Image search failed. Please try another image.';
      setError(msg);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    searchByImage,
    isSearching,
    results,
    error,
    clearResults,
  };
}
