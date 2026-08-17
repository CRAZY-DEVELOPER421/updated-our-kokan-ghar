'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import Skeleton from '@/components/ui/Skeleton';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/users/notifications');
      return res.data.data.notifications || res.data.data || [];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notif-unread-count'] });
  };

  const readMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/users/notifications/${id}/read`);
    },
    onSuccess: invalidateAll,
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await api.put('/users/notifications/read-all');
    },
    onSuccess: invalidateAll,
  });

  const getIcon = (type) => {
    const iconMap = {
      order_confirmed: 'check', order_shipped: 'package', order_delivered: 'truck',
      order_cancelled: 'x', payment_received: 'card', payment_failed: 'alert',
      wishlist_back_in_stock: 'refresh', price_drop: 'tag', loyalty_earned: 'star',
      coupon_received: 'ticket', review_responded: 'message', default: 'bell',
    };
    const icon = iconMap[type] || iconMap.default;
    const icons = {
      check: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
      package: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      truck: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      x: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
      card: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      alert: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      refresh: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      tag: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
      star: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
      ticket: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
      message: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
      bell: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    };
    return icons[icon] || icons.bell;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Resolve where a notification should navigate when clicked, from the JSON
  // `data` payload the backend stored with it (order_id / slug / etc.).
  // Types without a known target fall back to plain read-only cards.
  const getNotificationLink = (n) => {
    let data = n.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = {}; } }
    data = data || {};
    switch (n.type) {
      case 'price_drop':
        return data.slug ? `/products/${data.slug}` : (data.product_id ? `/products/${data.product_id}` : null);
      case 'wishlist_back_in_stock':
        return data.slug ? `/products/${data.slug}` : (data.product_id ? `/products/${data.product_id}` : null);
      case 'review_responded':
        return data.slug ? `/products/${data.slug}#reviews` : null;
      case 'order_confirmed':
      case 'order_shipped':
      case 'order_delivered':
      case 'order_cancelled':
      case 'payment_received':
      case 'payment_failed':
        return data.order_id ? `/account/orders/${data.order_id}` : null;
      case 'coupon_received':
        return '/coupons';
      case 'loyalty_earned':
        return '/account/loyalty';
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read && n.is_read !== 1).length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl card p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-1"><Skeleton variant="title" className="w-3/4" /><Skeleton variant="text" className="w-1/2" /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-konkan-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="text-xs text-konkan-green-primary hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      )}

      {/* List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl card p-10 text-center">
          <div className="mb-4 flex justify-center">
          <svg className="w-10 h-10 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
          <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-1">No notifications</h2>
          <p className="text-sm text-konkan-text-secondary">We'll notify you when something important happens.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => {
            const isUnread = !n.is_read && n.is_read !== 1;
            const onOpen = () => { if (isUnread) readMutation.mutate(n.id); };
            const cardClass = `w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors ${
              isUnread ? 'bg-konkan-green-primary/5 hover:bg-konkan-green-primary/10' : 'hover:bg-konkan-cream'
            }`;
            const link = getNotificationLink(n);
            const cardContent = (
              <>
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${
                  isUnread ? 'bg-konkan-green-primary/10' : 'bg-konkan-cream'
                }`}>
                  {getIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${isUnread ? 'font-medium text-konkan-text-primary' : 'text-konkan-text-secondary'}`}>
                      {n.title || n.message}
                    </p>
                    <span className="text-[10px] text-konkan-text-secondary shrink-0 whitespace-nowrap">
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                  {n.message && n.title && (
                    <p className="text-xs text-konkan-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                </div>

                {/* Unread Dot */}
                {isUnread && (
                  <div className="w-2 h-2 rounded-full bg-konkan-green-primary shrink-0 mt-2" />
                )}
              </>
            );
            // Clickable: navigates to the related page (product / order / etc.)
            // and marks the notification read. Without a target, plain button.
            return link ? (
              <Link key={n.id} href={link} onClick={onOpen} className={cardClass}>
                {cardContent}
              </Link>
            ) : (
              <button key={n.id} onClick={onOpen} className={cardClass}>
                {cardContent}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
