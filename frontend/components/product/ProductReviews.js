'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ProductReviews({ productId, ratingStats }) {
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', body: '' });
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
            <Button
              onClick={() => submitMutation.mutate(newReview)}
              loading={submitMutation.isLoading}
              disabled={!newReview.body.trim()}
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
