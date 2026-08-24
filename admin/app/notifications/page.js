'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import PushImageUpload from '@/components/PushImageUpload';

// ── Destination presets ──────────────────────────────────────
const DESTINATIONS = [
  { label: 'Homepage', value: '/' },
  { label: 'Flash Sale', value: '/flash-sale' },
  { label: 'All Products', value: '/products' },
  { label: 'Custom URL', value: '__custom__' },
];

// ── Skeleton ────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

// ── Notification Preview Card (matches real push notification) ──
function NotificationPreview({ title, body, imageUrl }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-sm w-full">
      {/* App header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">KG</span>
        </div>
        <span className="text-xs font-semibold text-gray-700">Kokan Ghar</span>
        <span className="text-[10px] text-gray-400 ml-auto">now</span>
      </div>

      {/* Notification content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {title || 'Notification Heading'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {body || 'Notification description will appear here...'}
            </p>
          </div>
        </div>

        {/* Image preview — matches how user will see it */}
        {imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-32 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 border border-green-200">
            Open
          </button>
          <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirmation Modal ──────────────────────────────────────
function ConfirmModal({ open, subscriberCount, onConfirm, onCancel, sending }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Send Broadcast?</h3>
          <p className="text-sm text-gray-500 mt-2">
            This will send a push notification to{' '}
            <span className="font-bold text-gray-900">{subscriberCount.toLocaleString()}</span>{' '}
            subscriber{subscriberCount !== 1 ? 's' : ''}. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </>
            ) : (
              'Yes, Send Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Result Modal ────────────────────────────────────────────
function ResultModal({ open, result, onClose }) {
  if (!open || !result) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Broadcast Sent!</h3>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
              <p className="text-[10px] text-green-600 font-medium mt-0.5">Delivered</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-amber-600">{result.expiredRemoved}</p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Expired</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              <p className="text-[10px] text-red-600 font-medium mt-0.5">Failed</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Total attempted: {result.totalAttempted.toLocaleString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ── Resend Confirmation Modal ───────────────────────────────
function ResendModal({ open, broadcast, subscriberCount, onConfirm, onCancel, sending }) {
  if (!open || !broadcast) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Resend Broadcast?</h3>
          <p className="text-sm text-gray-500 mt-2">
            Resend to <span className="font-bold text-gray-900">{subscriberCount.toLocaleString()}</span> subscribers:
          </p>
          {/* Preview of what will be resent */}
          <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-left">
            <p className="text-sm font-semibold text-gray-900">{broadcast.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{broadcast.body}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </>
            ) : (
              'Yes, Resend Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function NotificationsPage() {
  const [form, setForm] = useState({
    title: '',
    body: '',
    imageUrl: '',
    destination: '/',
    customUrl: '',
  });
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Resend state
  const [resendTarget, setResendTarget] = useState(null);
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const [resending, setResending] = useState(false);

  const fetchHistory = useCallback(() => {
    api.get('/admin/push/broadcast/history')
      .then(res => setHistory(res.data.data?.broadcasts || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  // Fetch subscriber count + history on mount
  useEffect(() => {
    api.get('/admin/push/subscribers/count')
      .then(res => setSubscriberCount(res.data.data?.count || 0))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchHistory();
  }, [fetchHistory]);

  const getClickUrl = () => {
    if (form.destination === '__custom__') return form.customUrl || '/';
    return form.destination;
  };

  // ── Send broadcast ──
  const handleSend = async () => {
    setSending(true);
    try {
      const res = await api.post('/admin/push/broadcast', {
        title: form.title.trim(),
        body: form.body.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        clickUrl: getClickUrl(),
      });
      setResult(res.data.data);
      setShowConfirm(false);
      setShowResult(true);
      toast.success('Broadcast sent successfully!');
      fetchHistory();
      setForm({ title: '', body: '', imageUrl: '', destination: '/', customUrl: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  // ── Resend broadcast ──
  const handleResend = (broadcast) => {
    setResendTarget(broadcast);
    setShowResendConfirm(true);
  };

  const handleResendConfirm = async () => {
    if (!resendTarget) return;
    setResending(true);
    try {
      const res = await api.post('/admin/push/broadcast', {
        title: resendTarget.title,
        body: resendTarget.body,
        imageUrl: resendTarget.image_url || undefined,
        clickUrl: resendTarget.url || '/',
      });
      setResult(res.data.data);
      setShowResendConfirm(false);
      setShowResult(true);
      toast.success('Broadcast resent successfully!');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend broadcast');
    } finally {
      setResending(false);
    }
  };

  const isValid = form.title.trim() && form.body.trim() && getClickUrl();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Send broadcast notifications to all subscribers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Form ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Compose Notification</h2>

            {/* Heading */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Heading <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Flash Sale — 50% OFF!"
                maxLength={50}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1">{form.title.length}/50 characters</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="e.g. Alphonso mangoes at half price — limited stock!"
                maxLength={120}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">{form.body.length}/120 characters</p>
            </div>

            {/* Image Upload — Browse / Drag & Drop / Crop */}
            <PushImageUpload
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
            />

            {/* Open Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Open Link <span className="text-red-500">*</span>
              </label>
              <select
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
              >
                {DESTINATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {form.destination === '__custom__' && (
                <input
                  type="url"
                  value={form.customUrl}
                  onChange={(e) => setForm({ ...form, customUrl: e.target.value })}
                  placeholder="https://kokanghar.in/your-page"
                  className="w-full px-4 py-2.5 mt-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                />
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!isValid || loading}
              className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Send to {subscriberCount.toLocaleString()} subscribers
            </button>
          </div>

          {/* ── Broadcast History ──────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Recent Broadcasts</h2>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No broadcasts sent yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((h) => (
                  <div key={h.id} className="group p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{h.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{h.body}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-gray-400">
                            {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}
                            {new Date(h.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                            {h.total_sent} sent
                          </span>
                          {h.total_clicked > 0 && (
                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                              {h.total_clicked} clicked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Resend Button */}
                      <button
                        onClick={() => handleResend(h)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all opacity-70 group-hover:opacity-100"
                        title="Resend this broadcast"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                        </svg>
                        Resend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Live Preview ─────────────────────────────── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Live Preview</h2>
            <div className="flex justify-center">
              <NotificationPreview
                title={form.title}
                body={form.body}
                imageUrl={form.imageUrl}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-3">
              This is how users will see the notification
            </p>
          </div>

          {/* Subscriber count card */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '...' : subscriberCount.toLocaleString()}</p>
                <p className="text-green-200 text-xs">Active subscribers</p>
              </div>
            </div>
            <p className="text-green-200 text-[11px]">
              Notifications will be sent to all devices with active push subscriptions.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">💡 Tips</h3>
            <ul className="text-xs text-amber-700 space-y-1.5">
              <li>• Keep headings under 50 characters</li>
              <li>• Descriptions work best at 100-120 characters</li>
              <li>• Add an image for higher engagement</li>
              <li>• Test with a small group before big sends</li>
              <li>• Use Resend to re-deliver past broadcasts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      <ConfirmModal
        open={showConfirm}
        subscriberCount={subscriberCount}
        onConfirm={handleSend}
        onCancel={() => setShowConfirm(false)}
        sending={sending}
      />
      <ResultModal
        open={showResult}
        result={result}
        onClose={() => setShowResult(false)}
      />
      <ResendModal
        open={showResendConfirm}
        broadcast={resendTarget}
        subscriberCount={subscriberCount}
        onConfirm={handleResendConfirm}
        onCancel={() => { setShowResendConfirm(false); setResendTarget(null); }}
        sending={resending}
      />
    </div>
  );
}
