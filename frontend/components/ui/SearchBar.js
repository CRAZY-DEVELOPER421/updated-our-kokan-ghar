'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/search/suggestions?q=${encodeURIComponent(q)}`);
      if (res.data.success) {
        setSuggestions([
          ...res.data.data.suggestions.map(s => ({ ...s, type: 'product' })),
          ...res.data.data.categorySuggestions.map(s => ({ ...s, type: 'category' })),
        ]);
        setIsOpen(true);
      }
    } catch (error) {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      onSearch?.();
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search mangoes, cashews, spices..."
          className="w-full pl-12 pr-5 py-4 !rounded-[5px] border-2 border-konkan-sand bg-konkan-cream/50 text-sm placeholder:text-konkan-text-secondary/50 focus-visible:border-konkan-green-primary"
          suppressHydrationWarning
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-modal border border-konkan-sand z-[100] py-2 max-h-80 overflow-y-auto">
          {suggestions.map((item, idx) => (
            item.type === 'product' ? (
              <Link
                key={`p-${idx}`}
                href={`/products/${item.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-konkan-cream transition-colors"
                onClick={() => { setIsOpen(false); setQuery(''); onSearch?.(); }}
              >
                <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-foreground">{item.name}</span>
              </Link>
            ) : (
              <Link
                key={`c-${idx}`}
                href={`/categories/${item.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-konkan-cream transition-colors"
                onClick={() => { setIsOpen(false); setQuery(''); onSearch?.(); }}
              >
                <svg className="w-3.5 h-3.5 text-[#E87722] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm"><span className="text-muted-foreground">Category:</span> {item.name}</span>
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
}
