'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import useVoiceSearch from '@/lib/hooks/useVoiceSearch';
import parseVoiceQuery from '@/lib/parseVoiceQuery';
import ImageSearchModal from '@/components/ui/ImageSearchModal';

const VOICE_HINT_KEY = 'kb_voice_hint_dismissed';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFirstVisitHint, setShowFirstVisitHint] = useState(false);
  const [showUnsupportedMsg, setShowUnsupportedMsg] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [voiceOverlay, setVoiceOverlay] = useState(false);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const firstVisitTimerRef = useRef(null);

  const voice = useVoiceSearch();

  useEffect(() => { setMounted(true); }, []);

  // ── First-visit hint ──
  useEffect(() => {
    if (!voice.isSupported) return;
    try {
      const dismissed = localStorage.getItem(VOICE_HINT_KEY);
      if (!dismissed) {
        firstVisitTimerRef.current = setTimeout(() => {
          setShowFirstVisitHint(true);
          const autoHide = setTimeout(() => {
            setShowFirstVisitHint(false);
            try { localStorage.setItem(VOICE_HINT_KEY, '1'); } catch { /* ignore storage errors */ }
          }, 6000);
          return () => clearTimeout(autoHide);
        }, 1500);
      }
    } catch { /* storage may be unavailable (private mode) */ }
    return () => { if (firstVisitTimerRef.current) clearTimeout(firstVisitTimerRef.current); };
  }, [voice.isSupported]);

  const dismissFirstVisitHint = () => {
    setShowFirstVisitHint(false);
    try { localStorage.setItem(VOICE_HINT_KEY, '1'); } catch { /* ignore */ }
  };

  // ── Click-outside close ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Suggestions ──
  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < 2) { setSuggestions([]); setIsOpen(false); return; }
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
    } catch { setSuggestions([]); } finally { setIsLoading(false); }
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
      const url = buildSearchUrl(query.trim());
      router.push(url);
      setIsOpen(false);
      onSearch?.();
    }
  };

  // ── Build search URL from parsed voice query ──
  const buildSearchUrl = useCallback((spoken) => {
    const parsed = parseVoiceQuery(spoken);
    const params = new URLSearchParams();

    // Keywords = the meaningful words left after prices/categories/stopwords
    // are removed. NEVER fall back to the raw phrase when only filters were
    // spoken (e.g. "cashew under 500" → category + max price, no q) — the
    // backend treats q as optional when a category/price filter is present.
    const term = (parsed.keywords || '').trim();
    const hasFilters = !!(parsed.minPrice || parsed.maxPrice || parsed.category);
    if (term) {
      params.set('q', term);
    } else if (!hasFilters && spoken.trim()) {
      // Nothing structured was recognised — search the phrase as typed text.
      params.set('q', spoken.trim());
    }

    if (parsed.minPrice) params.set('min_price', parsed.minPrice);
    if (parsed.maxPrice) params.set('max_price', parsed.maxPrice);
    if (parsed.category) params.set('category', parsed.category);

    return `/search?${params.toString()}`;
  }, []);

  // ── Voice overlay functions ──
  const searchWithVoice = useCallback(() => {
    const spoken = voice.transcript.trim();
    if (spoken) {
      setQuery(spoken);
      voice.stopListening();
      setVoiceOverlay(false);
      const url = buildSearchUrl(spoken);
      setTimeout(() => {
        router.push(url);
        setIsOpen(false);
        onSearch?.();
      }, 300);
    } else {
      voice.stopListening();
      setVoiceOverlay(false);
    }
    voice.clearTranscript();
  }, [voice, router, onSearch, buildSearchUrl]);

  const openVoiceOverlay = () => {
    if (showFirstVisitHint) dismissFirstVisitHint();
    if (!voice.isSupported) {
      setShowUnsupportedMsg(true);
      setTimeout(() => setShowUnsupportedMsg(false), 4000);
      return;
    }
    voice.clearTranscript();
    setVoiceOverlay(true);
    voice.startListening();
  };

  const closeVoiceOverlay = () => {
    // If user has transcript, search with it before closing
    const spoken = voice.transcript.trim();
    voice.stopListening();
    setVoiceOverlay(false);
    if (spoken) {
      setQuery(spoken);
      setTimeout(() => {
        // Same parser as the mic button, so price/category spoken with the
        // close action are respected too (not just the raw phrase).
        router.push(buildSearchUrl(spoken));
        setIsOpen(false);
        onSearch?.();
      }, 300);
    }
    voice.clearTranscript();
  };

  // Toggle mic in overlay: if listening → stop (but keep overlay), if stopped → restart
  const toggleOverlayMic = () => {
    if (voice.isListening) {
      voice.stopListening();
      // Overlay stays open — user can tap mic again to restart
    } else {
      // Restart listening (accumulates with previous transcript)
      voice.startListening();
    }
  };

  // ── Body scroll lock when overlay is open ──
  useEffect(() => {
    if (voiceOverlay) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [voiceOverlay]);

  // ── Image search handlers ──
  const handleImageClick = () => { fileInputRef.current?.click(); };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImageSearchOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageSearch = (searchQuery) => {
    setImageSearchOpen(false);
    setImageFile(null);
    setQuery(searchQuery);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    onSearch?.();
  };

  const closeImageSearch = () => { setImageSearchOpen(false); setImageFile(null); };

  // Determine overlay state text
  // Determine overlay state
  const overlayState = voice.micPermission === 'denied' ? 'denied'
    : voice.isListening ? 'listening'
    : voice.hasTranscript ? 'paused'
    : 'idle';

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
          className="w-full pl-12 pr-24 py-4 !rounded-[5px] border-2 border-konkan-sand bg-konkan-cream/50 text-sm placeholder:text-konkan-text-secondary/50 focus-visible:border-konkan-green-primary"
          suppressHydrationWarning
        />

        {isLoading && (
          <div className="absolute right-20 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Camera / Image Search button ── */}
        <button type="button" onClick={handleImageClick}
          className="absolute right-10 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-konkan-sand/40 transition-all duration-200"
          aria-label="Search by image" title="Upload image to search similar products">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

        {/* ── Mic button ── */}
        <button type="button" onClick={openVoiceOverlay}
          className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full transition-all duration-200 ${
            showFirstVisitHint ? 'text-konkan-green-primary bg-konkan-green-primary/10 animate-bounce'
            : 'text-muted-foreground hover:text-foreground hover:bg-konkan-sand/40'
          }`}
          aria-label="Start voice search"
          title={!mounted ? 'Search by voice' : !voice.isSupported ? 'Voice search works best in Chrome' : 'Tap to search by voice (Hindi / English)'}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
      </form>

      {/* ── First-visit tooltip ── */}
      {showFirstVisitHint && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-konkan-sand z-[110] p-3 cursor-pointer" onClick={dismissFirstVisitHint}>
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">🎙️</span>
            <div>
              <p className="text-xs font-semibold text-konkan-text-primary mb-0.5">Voice Search</p>
              <p className="text-[11px] text-konkan-text-secondary leading-relaxed">
                Tap the mic and say <strong>&quot;आम&quot;</strong> or <strong>&quot;cashew&quot;</strong> — search hoga automatically!
              </p>
              <p className="text-[10px] text-konkan-text-secondary/60 mt-1">Hindi + English dono supported · Chrome best</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); dismissFirstVisitHint(); }} className="text-konkan-text-secondary/40 hover:text-konkan-text-secondary shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="absolute -top-1.5 right-5 w-3 h-3 bg-white border-l border-t border-konkan-sand rotate-45" />
        </div>
      )}

      {/* ── Unsupported browser message ── */}
      {showUnsupportedMsg && (
        <div className="absolute top-full mt-1 w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 z-[100] flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-amber-700">Voice search Chrome mein best kaam karta hai. Chrome use karein.</span>
        </div>
      )}

      {/* ── Suggestions dropdown ── */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-modal border border-konkan-sand z-[100] py-2 max-h-80 overflow-y-auto">
          {suggestions.map((item, idx) => (
            item.type === 'product' ? (
              <Link key={`p-${idx}`} href={`/products/${item.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-konkan-cream transition-colors"
                onClick={() => { setIsOpen(false); setQuery(''); onSearch?.(); }}>
                <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-foreground">{item.name}</span>
              </Link>
            ) : (
              <Link key={`c-${idx}`} href={`/categories/${item.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-konkan-cream transition-colors"
                onClick={() => { setIsOpen(false); setQuery(''); onSearch?.(); }}>
                <svg className="w-3.5 h-3.5 text-[#E87722] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm"><span className="text-muted-foreground">Category:</span> {item.name}</span>
              </Link>
            )
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          VOICE OVERLAY — centered circle popup, outside click closes
          ═══════════════════════════════════════════════════════════ */}
      {voiceOverlay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={closeVoiceOverlay}>
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Centered circle popup */}
          <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
            {/* ═══ Animated mic + rings + sound waves ═══ */}
            <div className="relative flex items-center justify-center">
            {/* Expanding rings — only when listening */}
            {overlayState === 'listening' && (
              <>
                <div className="absolute w-40 h-40 rounded-full border border-red-400/30 animate-ping-slow" />
                <div className="absolute w-48 h-48 rounded-full border border-red-400/15 animate-ping-slower" />
              </>
            )}

            {/* Static green ring — when paused/stopped */}
            {overlayState !== 'listening' && (
              <div className="absolute w-36 h-36 rounded-full border-2 border-white/10" />
            )}

            {/* Pulsing glow behind mic — only when listening */}
            <div className={`absolute w-24 h-24 rounded-full transition-all duration-300 ${
              overlayState === 'listening'
                ? 'bg-red-500/40 animate-mic-pulse scale-110'
                : 'opacity-0 scale-75'
            }`} />

            {/* The big mic button */}
            <button onClick={toggleOverlayMic}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                overlayState === 'listening'
                  ? 'bg-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.5)]'
                  : overlayState === 'paused'
                    ? 'bg-emerald-500 scale-100 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                    : overlayState === 'denied'
                      ? 'bg-red-900/50 scale-100 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-100 scale-100 shadow-lg'
              }`}>
              {overlayState === 'denied' ? (
                /* Blocked mic icon */
                <svg className="w-10 h-10 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                  <line x1="2" x2="22" y1="2" y2="22" strokeWidth={2.5} />
                </svg>
              ) : overlayState === 'listening' ? (
                /* Mic with sound wave lines — actively listening */
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                  {/* Sound wave lines */}
                  <path d="M1.5 12c0 0 3-4.5 10.5-4.5S22.5 12 22.5 12" strokeWidth="1.5" opacity="0.4" className="animate-wave-1" />
                  <path d="M4 12c0 0 2.2-3 8-3s8 3 8 3" strokeWidth="1.5" opacity="0.6" className="animate-wave-2" />
                </svg>
              ) : overlayState === 'paused' ? (
                /* Green mic with checkmark — stopped, has transcript */
                <div className="relative">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ) : (
                /* White mic — idle, tap to start */
                <svg className="w-10 h-10 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              )}
            </button>

            {/* Sound wave bars — only when listening */}
            {overlayState === 'listening' && (
              <div className="absolute -bottom-2 flex items-end gap-1 h-6">
                <div className="w-1 bg-red-400 rounded-full animate-bar-1" style={{ height: '8px' }} />
                <div className="w-1 bg-red-400 rounded-full animate-bar-2" style={{ height: '14px' }} />
                <div className="w-1 bg-red-400 rounded-full animate-bar-3" style={{ height: '6px' }} />
                <div className="w-1 bg-red-400 rounded-full animate-bar-4" style={{ height: '16px' }} />
                <div className="w-1 bg-red-400 rounded-full animate-bar-5" style={{ height: '10px' }} />
                <div className="w-1 bg-red-400 rounded-full animate-bar-6" style={{ height: '12px' }} />
                <div className="w-1 bg-red-400 rounded-full animate-bar-7" style={{ height: '5px' }} />
              </div>
            )}
          </div>

          {/* Custom CSS animations */}
          <style jsx>{`
            @keyframes mic-pulse {
              0%, 100% { transform: scale(1.1); opacity: 0.4; }
              50% { transform: scale(1.3); opacity: 0.15; }
            }
            @keyframes ping-slow {
              0% { transform: scale(0.8); opacity: 0.6; }
              100% { transform: scale(1.4); opacity: 0; }
            }
            @keyframes ping-slower {
              0% { transform: scale(0.8); opacity: 0.4; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            @keyframes bar-dance {
              0%, 100% { transform: scaleY(0.4); }
              50% { transform: scaleY(1); }
            }
            @keyframes wave-pulse {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.8; }
            }
            .animate-mic-pulse { animation: mic-pulse 1.5s ease-in-out infinite; }
            .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
            .animate-ping-slower { animation: ping-slower 2.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s; }
            .animate-bar-1 { animation: bar-dance 0.8s ease-in-out infinite 0s; }
            .animate-bar-2 { animation: bar-dance 0.8s ease-in-out infinite 0.1s; }
            .animate-bar-3 { animation: bar-dance 0.8s ease-in-out infinite 0.2s; }
            .animate-bar-4 { animation: bar-dance 0.8s ease-in-out infinite 0.05s; }
            .animate-bar-5 { animation: bar-dance 0.8s ease-in-out infinite 0.15s; }
            .animate-bar-6 { animation: bar-dance 0.8s ease-in-out infinite 0.25s; }
            .animate-bar-7 { animation: bar-dance 0.8s ease-in-out infinite 0.3s; }
            .animate-wave-1 { animation: wave-pulse 1.2s ease-in-out infinite; }
            .animate-wave-2 { animation: wave-pulse 1.2s ease-in-out infinite 0.3s; }
          `}</style>

          {/* Status text */}
          <div className="text-center px-4 mt-5">
            {overlayState === 'denied' && (
              <>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                    <line x1="3" x2="21" y1="3" y2="21" strokeWidth={2.5} />
                  </svg>
                  <p className="text-red-400 text-lg font-bold">Mic Blocked</p>
                </div>
                {!voice.isSecureContext ? (
                  /* HTTP insecure origin — need Chrome flag */
                  <>
                    <p className="text-white/50 text-sm mb-2">HTTP pe mic kaam nahi karta</p>
                    <div className="bg-white/10 rounded-xl px-4 py-3 text-left inline-block max-w-xs">
                      <p className="text-amber-400 text-xs mb-2 font-semibold">⚡ Quick Fix — Chrome Flag:</p>
                      <p className="text-white/60 text-xs mb-1">1. Chrome mein jaayein:</p>
                      <p className="text-white/80 text-[11px] bg-white/10 rounded px-2 py-1 font-mono mb-2 break-all">chrome://flags/#unsafely-treat-insecure-origin-as-secure</p>
                      <p className="text-white/60 text-xs mb-1">2. Flag enable karein</p>
                      <p className="text-white/60 text-xs mb-1">3. Box mein ye daalein:</p>
                      <p className="text-white/80 text-[11px] bg-white/10 rounded px-2 py-1 font-mono mb-2">http://localhost:3000</p>
                      <p className="text-white/60 text-xs">4. &ldquo;Relaunch&rdquo; click karein</p>
                    </div>
                  </>
                ) : (
                  /* HTTPS but still blocked */
                  <>
                    <p className="text-white/50 text-sm mb-2">Microphone access denied hai</p>
                    <div className="bg-white/10 rounded-xl px-4 py-3 text-left inline-block">
                      <p className="text-white/70 text-xs mb-1 font-medium">Enable karne ke liye:</p>
                      <p className="text-white/50 text-xs">1. Address bar mein 🔒 icon click karein</p>
                      <p className="text-white/50 text-xs">2. &ldquo;Microphone&rdquo; select karein</p>
                      <p className="text-white/50 text-xs">3. &ldquo;Allow&rdquo; choose karein</p>
                      <p className="text-white/50 text-xs">4. Page reload karein</p>
                    </div>
                  </>
                )}
              </>
            )}

            {overlayState === 'listening' && (
              <>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <p className="text-red-400 text-xl font-bold tracking-wide">LISTENING</p>
                </div>
                {voice.interimTranscript ? (
                  <p className="text-white text-lg max-w-sm mx-auto px-4 mb-2">&ldquo;{voice.interimTranscript}&rdquo;</p>
                ) : (
                  <p className="text-white/50 text-sm">Bolo kuch — jaise &quot;आम&quot; ya &quot;cashew&quot;</p>
                )}
              </>
            )}

            {overlayState === 'paused' && (
              <>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-emerald-400 text-lg font-bold">STOPPED</p>
                </div>
                <p className="text-white/60 text-sm mb-2">Itna suna hai:</p>
                <p className="text-white text-base max-w-sm mx-auto px-4 font-medium">&ldquo;{voice.transcript}&rdquo;</p>
                <p className="text-white/40 text-xs mt-3">Green mic dabayein dobara sunne ke liye</p>
              </>
            )}

            {overlayState === 'idle' && (
              <>
                <p className="text-white/70 text-lg font-medium mb-2">Mic dabayein shuru karne ke liye</p>
                <p className="text-white/35 text-sm">Hindi ya English mein bole</p>
              </>
            )}
          </div>

          {/* Search button — only when paused with transcript */}
          {overlayState === 'paused' && voice.hasTranscript && (
            <button onClick={searchWithVoice}
              className="mt-4 px-5 py-2.5 bg-emerald-500 text-white rounded-full font-semibold text-sm hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg mx-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          )}

          {/* Hint text */}
          <p className="text-white/25 text-xs mt-4 text-center">
            {overlayState === 'denied'
              ? (voice.isSecureContext ? 'Settings mein jaake mic enable karein' : 'Chrome flag enable karein ya localhost pe HTTPS use karein')
              : 'Bahar click karein band karne ke liye'}
          </p>
          </div>
        </div>
      )}

      {/* ── Image Search Modal ── */}
      <ImageSearchModal
        isOpen={imageSearchOpen}
        onClose={closeImageSearch}
        imageFile={imageFile}
        onSearch={handleImageSearch}
      />
    </div>
  );
}
