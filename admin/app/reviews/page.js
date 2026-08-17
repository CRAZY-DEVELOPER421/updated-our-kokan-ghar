'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} star rating`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </span>
  );
}

function mediaCount(images) {
  if (!Array.isArray(images)) return 0;
  return images.filter((m) => m && (typeof m === 'string' ? m.trim() : m.url)).length;
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'hidden', label: 'Hidden' },
];

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [productId, setProductId] = useState(''); // filter: only this product's reviews
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyTarget, setReplyTarget] = useState(null); // review being replied to
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-reviews', page, status, searchTerm, productId],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20, status, search: searchTerm });
      if (productId) params.set('product_id', productId);
      const res = await api.get(`/admin/reviews?${params.toString()}`);
      return res.data.data;
    },
    retry: 1,
  });

  const reviews = data?.reviews || [];
  const productCards = data?.productCards || [];
  const stats = data?.stats || {};
  const totalPages = data?.pagination?.pages || 1;
  const total = data?.pagination?.total || 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });

  const handleToggle = async (review, approved) => {
    try {
      await api.put(`/admin/reviews/${review.id}/status`, { approved });
      toast.success(approved ? 'Review approved — now visible on the site.' : 'Review hidden from the site.');
      invalidate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update review.');
    }
  };

  const openReply = (review) => {
    setReplyTarget(review);
    setReplyText(review.admin_reply || '');
  };

  const handleSaveReply = async () => {
    if (!replyTarget) return;
    setSavingReply(true);
    try {
      await api.put(`/admin/reviews/${replyTarget.id}/reply`, { reply: replyText });
      toast.success(replyText.trim() ? 'Reply posted.' : 'Reply removed.');
      setReplyTarget(null);
      invalidate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reply.');
    } finally {
      setSavingReply(false);
    }
  };

  const handleDelete = async (review) => {
    try {
      await api.delete(`/admin/reviews/${review.id}`);
      toast.success('Review deleted.');
      setConfirmDelete(null);
      invalidate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  const handleHomeToggle = async (review, showOnHome) => {
    try {
      await api.put(`/admin/reviews/${review.id}/home`, { show_on_home: showOnHome });
      toast.success(showOnHome ? 'Added to homepage slider.' : 'Removed from homepage slider.');
      invalidate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update homepage flag.');
    }
  };

  const activeProduct = productCards.find((p) => String(p.id) === String(productId)) || null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-28 h-8 mb-1" /><Skeleton className="w-24 h-4" /></div>
          <Skeleton className="w-48 h-10 rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="w-14 h-14 rounded-lg" />
                <div className="flex-1"><Skeleton className="w-40 h-4 mb-1" /><Skeleton className="w-24 h-3 mb-2" /><Skeleton className="w-full h-3" /></div>
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load reviews</span>
            <button onClick={() => refetch()} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} review{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh reviews"
            aria-label="Refresh reviews"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-wait transition-all"
          >
            <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search product, customer, or text..."
              className="w-full sm:w-72 pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Moderation stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Reviews', value: stats.total ?? 0, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Approved (visible)', value: stats.approved ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Hidden', value: stats.hidden ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'With Reply', value: stats.with_reply ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'On Home', value: stats.on_home ?? 0, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">{s.label}</p>
                <p className={`text-xl font-bold leading-tight ${s.color}`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Product cards grid: every product + its review count ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Products</h2>
            <p className="text-[11px] text-slate-500">
              {activeProduct ? `Showing reviews for: ${activeProduct.name}` : 'Showing reviews for all products'}
            </p>
          </div>
          <button
            onClick={() => { setProductId(''); setPage(1); }}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
              productId ? 'text-slate-600 bg-slate-100 hover:bg-slate-200' : 'text-emerald-700 bg-emerald-50 cursor-default'
            }`}
          >
            All Products
          </button>
        </div>
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {productCards.map((p) => {
            const active = String(p.id) === String(productId);
            return (
              <button
                key={p.id}
                onClick={() => { setProductId(active ? '' : String(p.id)); setPage(1); }}
                title={`${p.name} — ${p.total_reviews} review${p.total_reviews === 1 ? '' : 's'}`}
                className={`flex flex-col items-center rounded-xl border p-2 transition-all ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                }`}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                  )}
                </div>
                <p className="w-full text-[9px] leading-tight font-medium text-slate-700 text-center mt-1.5 line-clamp-2">{p.name}</p>
                <div className={`w-full mt-1 px-1 py-0.5 rounded-md text-center text-[10px] font-bold ${
                  Number(p.total_reviews) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                }`}>
                  {p.total_reviews} review{p.total_reviews === 1 ? '' : 's'}
                </div>
                {Number(p.on_home) > 0 && (
                  <span className="mt-1 text-[8px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">★ {p.on_home} on home</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === 'all' ? stats.total : tab.key === 'approved' ? stats.approved : stats.hidden;
          const active = status === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {tab.label} <span className={active ? 'text-emerald-200' : 'text-slate-400'}>{count ?? 0}</span>
            </button>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">
              {searchTerm || status !== 'all' ? 'No reviews match your filters' : 'No reviews yet'}
            </span>
            {(searchTerm || status !== 'all') && (
              <button onClick={() => { setSearchInput(''); setSearchTerm(''); setStatus('all'); setPage(1); }} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Clear filters</button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const approved = Number(review.is_approved) === 1;
            const hasReply = !!(review.admin_reply && review.admin_reply.trim());
            const media = mediaCount(review.images);
            return (
              <div key={review.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  {/* Product thumb */}
                  <div className="shrink-0 flex md:flex-col items-center gap-3 md:w-48">
                    {review.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={review.product_image} alt={review.product_name} className="w-14 h-14 md:w-20 md:h-20 rounded-lg object-cover border border-slate-100" />
                    ) : (
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">{review.product_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">#{review.product_id}</p>
                    </div>
                  </div>

                  {/* Review content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-slate-900">{review.user_name || 'Anonymous'}</span>
                      <span className="text-[10px] text-slate-400">{review.user_email}</span>
                      <Stars rating={review.rating} />
                      {review.is_verified_purchase === 1 && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">Verified Purchase</span>
                      )}
                      {media > 0 && (
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          {media} media
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-auto">{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {review.title && <p className="text-sm font-semibold text-slate-800">{review.title}</p>}
                    {review.body && <p className="text-sm text-slate-600 leading-relaxed mt-0.5">{review.body}</p>}

                    {/* Admin reply preview */}
                    {hasReply && (
                      <div className="mt-2 bg-emerald-50/60 border-l-2 border-emerald-500 rounded-r-lg px-3 py-2">
                        <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Your reply</p>
                        <p className="text-xs text-slate-700">{review.admin_reply}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold mr-1 ${
                        approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${approved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {approved ? 'Visible' : 'Hidden'}
                      </span>
                      {!approved ? (
                        <button onClick={() => handleToggle(review, true)} className="px-2.5 py-1 rounded-md text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all">
                          Approve
                        </button>
                      ) : (
                        <button onClick={() => handleToggle(review, false)} className="px-2.5 py-1 rounded-md text-[10px] font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all">
                          Hide
                        </button>
                      )}
                      <button onClick={() => openReply(review)} className="px-2.5 py-1 rounded-md text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">
                        {hasReply ? 'Edit Reply' : 'Reply'}
                      </button>
                      {Number(review.show_on_home) === 1 ? (
                        <button onClick={() => handleHomeToggle(review, false)} className="px-2.5 py-1 rounded-md text-[10px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all">
                          Remove from Home
                        </button>
                      ) : (
                        <button onClick={() => handleHomeToggle(review, true)} disabled={!approved} title={approved ? 'Show this review on the homepage slider' : 'Approve the review first to feature it on the homepage'} className="px-2.5 py-1 rounded-md text-[10px] font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                          + Add to Home
                        </button>
                      )}
                      <button onClick={() => setConfirmDelete(review)} className="px-2.5 py-1 rounded-md text-[10px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${page === p ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReplyTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{replyTarget.admin_reply ? 'Edit Reply' : 'Reply to Review'}</h3>
                <p className="text-xs text-slate-500">Shown publicly under the review on the product page.</p>
              </div>
            </div>

            <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Stars rating={replyTarget.rating} />
                <span className="text-xs font-medium text-slate-700">{replyTarget.user_name || 'Anonymous'}</span>
              </div>
              {replyTarget.body ? (
                <p className="text-xs text-slate-600 leading-relaxed">{replyTarget.body}</p>
              ) : (
                <p className="text-xs italic text-slate-400">No written text — rating only.</p>
              )}
            </div>

            <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Your reply</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Thank the customer, clarify a concern, or share an update..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Leave empty to remove the current reply.</p>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setReplyTarget(null)} className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
              <button
                onClick={handleSaveReply}
                disabled={savingReply}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {savingReply ? 'Saving...' : replyText.trim() ? 'Post Reply' : 'Remove Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Review</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-2">Delete this review by <strong>{confirmDelete.user_name || 'Anonymous'}</strong> on <strong>{confirmDelete.product_name}</strong>?</p>
            <p className="text-xs text-slate-500 mb-5">The product's average rating will be recalculated.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
