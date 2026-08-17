'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;

// Backend stores media as [{ type: 'image'|'video', url }]; older rows may be plain URL strings.
const normalizeMedia = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      if (typeof m === 'string' && m.trim()) return { type: 'image', url: m.trim() };
      if (m && typeof m === 'object' && m.url) return { type: m.type === 'video' ? 'video' : 'image', url: String(m.url) };
      return null;
    })
    .filter(Boolean);
};

function MediaLightbox({ media, index, onClose, onPrev, onNext }) {
  if (!media || media.length === 0) return null;
  const item = media[index];
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Review media viewer"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close media viewer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev / Next */}
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Previous media"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Next media"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Media */}
      <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        {item.type === 'video' ? (
          <video
            src={getImageUrl(item.url)}
            controls
            autoPlay
            playsInline
            className="max-h-[85vh] max-w-[90vw] rounded-xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(item.url)}
            alt="Review photo"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
          />
        )}
        <p className="text-center text-xs text-white/60 mt-3">
          {index + 1} / {media.length}
        </p>
      </div>
    </div>
  );
}

function ReviewMedia({ media }) {
  const [lightbox, setLightbox] = useState(null);
  const items = normalizeMedia(media);
  if (items.length === 0) return null;

  const open = (idx) => setLightbox({ media: items, index: idx });
  const prev = () => setLightbox((lb) => ({ ...lb, index: (lb.index - 1 + lb.media.length) % lb.media.length }));
  const next = () => setLightbox((lb) => ({ ...lb, index: (lb.index + 1) % lb.media.length }));

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        {items.map((m, idx) =>
          m.type === 'video' ? (
            <button
              key={idx}
              onClick={() => open(idx)}
              className="relative w-20 h-20 rounded-lg overflow-hidden bg-black shrink-0 group"
              aria-label="Play review video"
            >
              <video src={getImageUrl(m.url)} muted playsInline preload="metadata" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          ) : (
            <button
              key={idx}
              onClick={() => open(idx)}
              className="relative w-20 h-20 rounded-lg overflow-hidden bg-konkan-cream shrink-0"
              aria-label="View review photo"
            >
              <Image src={getImageUrl(m.url)} alt="Review photo" fill sizes="80px" className="object-cover" loading="lazy" />
            </button>
          )
        )}
      </div>
      {lightbox && (
        <MediaLightbox media={lightbox.media} index={lightbox.index} onClose={() => setLightbox(null)} onPrev={prev} onNext={next} />
      )}
    </>
  );
}

export default function ProductReviews({ productId, ratingStats }) {
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', body: '' });
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['product-reviews', productId, page],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/reviews?page=${page}&limit=8`);
      return res.data;
    },
    enabled: !!productId,
  });

  const submitMutation = useMutation({
    mutationFn: async (reviewData) => {
      const res = await api.post(`/products/${productId}/reviews`, reviewData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-reviews', productId]);
      queryClient.invalidateQueries(['product', productId]);
      setShowForm(false);
      setNewReview({ rating: 5, title: '', body: '' });
      setMedia([]);
      toast.success('Review submitted!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ reviewId, isHelpful }) => {
      const res = await api.post(`/reviews/${reviewId}/helpful`, { is_helpful: isHelpful });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product-reviews', productId]);
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate({ ...newReview, images: media });
  };

  // Upload selected files to the backend and append the returned URLs.
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file
    if (files.length === 0) return;

    const imageCount = media.filter((m) => m.type === 'image').length;
    const videoCount = media.filter((m) => m.type === 'video').length;
    const picked = files.filter((file) => {
      const isVideo = file.type.startsWith('video/');
      if (isVideo) {
        if (videoCount >= MAX_VIDEOS) { toast.error(`You can add up to ${MAX_VIDEOS} video`); return false; }
        if (file.size > 200 * 1024 * 1024) { toast.error(`${file.name} is over the 200MB video limit`); return false; }
        return true;
      }
      if (imageCount >= MAX_IMAGES) { toast.error(`You can add up to ${MAX_IMAGES} photos`); return false; }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is over the 10MB photo limit`); return false; }
      return true;
    });

    // Only the first N files (respecting caps) get uploaded.
    let allowedImages = MAX_IMAGES - imageCount;
    let allowedVideos = MAX_VIDEOS - videoCount;
    const toUpload = [];
    for (const file of picked) {
      const isVideo = file.type.startsWith('video/');
      if (isVideo && allowedVideos > 0) { toUpload.push(file); allowedVideos--; }
      else if (!isVideo && allowedImages > 0) { toUpload.push(file); allowedImages--; }
    }

    if (toUpload.length === 0) return;
    setUploading(true);
    const uploaded = [];
    for (const file of toUpload) {
      try {
        const isVideo = file.type.startsWith('video/');
        const fd = new FormData();
        fd.append(isVideo ? 'video' : 'image', file);
        const res = await api.post(isVideo ? '/upload/review-video' : '/upload/review-image', fd);
        if (res.data?.data?.url) uploaded.push({ type: isVideo ? 'video' : 'image', url: res.data.data.url });
      } catch (err) {
        toast.error(`Could not upload ${file.name}: ${err.response?.data?.message || 'Please try again'}`);
      }
    }
    setUploading(false);
    if (uploaded.length > 0) {
      setMedia((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES + MAX_VIDEOS));
      toast.success(`${uploaded.length} media file${uploaded.length > 1 ? 's' : ''} added`);
    }
  };

  const removeMedia = (idx) => setMedia((prev) => prev.filter((_, i) => i !== idx));

  const stats = data?.data?.ratingStats || ratingStats || {};
  const reviews = data?.data?.reviews || [];
  const totalReviews = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.pages || 1;

  const ratingDistribution = [
    { stars: 5, count: stats.five_star || 0 },
    { stars: 4, count: stats.four_star || 0 },
    { stars: 3, count: stats.three_star || 0 },
    { stars: 2, count: stats.two_star || 0 },
    { stars: 1, count: stats.one_star || 0 },
  ];

  const maxCount = Math.max(...ratingDistribution.map(r => r.count), 1);

  const avgRating = stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0';
  const totalCount = stats.total || 0;

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-konkan-cream/50 rounded-2xl">
        {/* Average Rating */}
        <div className="text-center md:border-r border-konkan-sand/50 pr-6">
          <div className="text-4xl font-display font-bold text-konkan-text-primary">{avgRating}</div>
          <StarRating rating={parseFloat(avgRating)} size="md" />
          <p className="text-sm text-konkan-text-secondary mt-1">{totalCount} review{totalCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Rating Bars */}
        <div className="md:col-span-2 space-y-1.5">
          {ratingDistribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-2 text-sm">
              <span className="w-12 text-right text-konkan-text-secondary shrink-0">{item.stars}★</span>
              <div className="flex-1 h-2.5 bg-konkan-sand rounded-full overflow-hidden">
                <div
                  className="h-full bg-konkan-gold rounded-full transition-all duration-500"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-8 text-xs text-konkan-text-secondary">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-konkan-text-primary">
          Reviews ({totalReviews})
        </h3>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} size="sm">
          {showForm ? 'Cancel' : 'Write a Review'}
        </Button>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-white rounded-xl card p-6">
          <h4 className="font-display font-bold text-konkan-text-primary mb-4">Write Your Review</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-konkan-text-primary mb-1">Your Rating</label>
              <StarRating
                rating={newReview.rating}
                size="lg"
                interactive
                onChange={(val) => setNewReview({ ...newReview, rating: val })}
              />
            </div>
            <div>
              <label htmlFor="review-title" className="block text-sm font-medium text-konkan-text-primary mb-1">Review Title</label>
              <input
                id="review-title"
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                placeholder="Summarize your review"
                className="input-field"
                maxLength={255}
              />
            </div>
            <div>
              <label htmlFor="review-body" className="block text-sm font-medium text-konkan-text-primary mb-1">Your Review</label>
              <textarea
                id="review-body"
                value={newReview.body}
                onChange={(e) => setNewReview({ ...newReview, body: e.target.value })}
                placeholder="Tell others about your experience with this product"
                rows={4}
                className="input-field resize-none"
                maxLength={5000}
              />
            </div>

            {/* Photo / Video upload */}
            <div>
              <label className="block text-sm font-medium text-konkan-text-primary mb-1">Add Photos / Video</label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-konkan-sand bg-konkan-cream/40 cursor-pointer hover:border-konkan-green-primary/60 hover:bg-konkan-green-primary/5 transition-colors text-sm text-konkan-text-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {uploading ? 'Uploading…' : 'Add photo / video'}
                  <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
                </label>
                <span className="text-xs text-konkan-text-secondary">
                  Up to {MAX_IMAGES} photos + {MAX_VIDEOS} video · photos ≤10MB · video ≤200MB
                </span>
              </div>

              {/* Selected media previews */}
              {media.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {media.map((m, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-konkan-cream shrink-0 group">
                      {m.type === 'video' ? (
                        <video src={getImageUrl(m.url)} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                      ) : (
                        <Image src={getImageUrl(m.url)} alt="Selected review media" fill sizes="80px" className="object-cover" />
                      )}
                      <button
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-konkan-error transition-colors"
                        aria-label="Remove media"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              loading={submitMutation.isLoading || uploading}
              disabled={!newReview.body.trim() || uploading}
            >
              Submit Review
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl card p-5 space-y-3">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-48" />
              <div className="skeleton h-16 w-full" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-2">
              <svg className="w-12 h-12 text-konkan-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-konkan-text-secondary">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-konkan-green-primary/20 to-konkan-cream flex items-center justify-center font-display font-bold text-konkan-green-primary text-sm">
                    {(review.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-konkan-text-primary text-sm">{review.user_name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="xs" />
                      {review.is_verified_purchase === 1 && (
                        <span className="text-[10px] text-konkan-success bg-konkan-success/10 px-1.5 py-0.5 rounded-full">Verified Purchase</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-konkan-text-secondary">{new Date(review.created_at).toLocaleDateString()}</span>
              </div>

              {review.title && (
                <h4 className="font-bold text-konkan-text-primary text-sm mb-1">{review.title}</h4>
              )}
              {review.body && (
                <p className="text-sm text-konkan-text-secondary leading-relaxed">{review.body}</p>
              )}

              {/* Photos / videos attached to the review */}
              <ReviewMedia media={review.images} />

              {/* Helpful */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-konkan-sand/50">
                <span className="text-xs text-konkan-text-secondary">Was this helpful?</span>
                <button
                  onClick={() => voteMutation.mutate({ reviewId: review.id, isHelpful: true })}
                  className="text-xs text-konkan-text-secondary hover:text-konkan-green-primary transition-colors"
                >
                  Yes ({review.helpful_count || 0})
                </button>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === i + 1
                    ? 'bg-konkan-green-primary text-white'
                    : 'text-konkan-text-secondary hover:bg-konkan-cream'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
