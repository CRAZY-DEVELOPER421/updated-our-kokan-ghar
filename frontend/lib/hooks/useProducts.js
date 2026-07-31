'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useProducts(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await api.get(`/products?${queryString}`);
      return res.data;
    },
    staleTime: 60000,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const res = await api.get('/products/featured');
      return res.data.data.products;
    },
    staleTime: 120000,
  });
}

export function useBestsellers() {
  return useQuery({
    queryKey: ['products', 'bestsellers'],
    queryFn: async () => {
      const res = await api.get('/products/bestsellers');
      return res.data.data.products;
    },
    staleTime: 120000,
  });
}

export function useSeasonalProducts() {
  return useQuery({
    queryKey: ['products', 'seasonal'],
    queryFn: async () => {
      const res = await api.get('/products/seasonal');
      return res.data.data.products;
    },
    staleTime: 120000,
  });
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: async () => {
      const res = await api.get('/products/new-arrivals');
      return res.data.data.products;
    },
    staleTime: 120000,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data.data.product;
    },
    enabled: !!slug,
    staleTime: 60000,
  });
}

export function useRelatedProducts(productId) {
  return useQuery({
    queryKey: ['products', 'related', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/related`);
      return res.data.data.products;
    },
    enabled: !!productId,
    staleTime: 60000,
  });
}

export function useProductReviews(productId, page = 1) {
  return useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/reviews?page=${page}`);
      return res.data;
    },
    enabled: !!productId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
    staleTime: 300000,
  });
}

export function useCategoryProducts(slug, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['category-products', slug, params],
    queryFn: async () => {
      const res = await api.get(`/categories/${slug}/products?${queryString}`);
      return res.data;
    },
    enabled: !!slug,
    staleTime: 60000,
  });
}
