'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

/**
 * Share modal — QR Code + Link tabs.
 * QR tab: encodes the given URL so another phone can scan it and open instantly.
 * Link tab: copy-to-clipboard + native Web Share (where available).
 */
export default function ShareModal({ isOpen, onClose, title = '', url = '', description = '' }) {
  const [tab, setTab] = useState('qr');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: title || undefined, text: description || undefined, url });
      } catch (err) {
        if (err.name !== 'AbortError') toast.error('Could not share');
      }
    } else {
      copyLink();
    }
  };

  const tabClass = (active) =>
    `flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
      active
        ? 'bg-konkan-green-primary text-white shadow-sm'
        : 'text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-green-primary/5'
    }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share" size="sm">
      {/* Tabs */}
      <div className="flex gap-1.5 bg-konkan-cream/60 dark:bg-white/5 rounded-xl p-1 mb-5">
        <button type="button" onClick={() => setTab('qr')} className={tabClass(tab === 'qr')}>
          QR Code
        </button>
        <button type="button" onClick={() => setTab('link')} className={tabClass(tab === 'link')}>
          Link
        </button>
      </div>

      {tab === 'qr' ? (
        <div className="text-center">
          {title && (
            <h3 className="font-display text-sm font-bold text-konkan-text-primary mb-1 line-clamp-2">{title}</h3>
          )}
          <p className="text-xs text-konkan-text-secondary mb-4">Scan with your phone camera to open instantly</p>

          {/* White box around the QR acts as the scanner quiet zone — works in dark mode too */}
          <div className="inline-block bg-white p-3 rounded-2xl border border-konkan-sand/40 shadow-sm">
            <QRCodeSVG value={url} size={176} />
          </div>

          <p className="text-[11px] text-konkan-text-secondary/70 mt-3">
            Works with WhatsApp & any camera app — no extra app needed
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-4 w-full py-2.5 text-sm font-semibold rounded-xl border border-konkan-sand text-konkan-text-secondary hover:text-konkan-green-primary hover:border-konkan-green-primary/40 hover:bg-green-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1" />
            </svg>
            Copy Link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-konkan-text-secondary mb-1">Share this link</p>
          <div className="bg-konkan-cream/60 dark:bg-white/5 rounded-xl px-3 py-2.5 text-xs text-konkan-text-primary break-all border border-konkan-sand/40">
            {url}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="w-full py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary text-white hover:from-konkan-green-dark hover:to-konkan-green-primary transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1" />
            </svg>
            Copy Link
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              type="button"
              onClick={nativeShare}
              className="w-full py-2.5 text-sm font-semibold rounded-xl border border-konkan-sand text-konkan-text-secondary hover:text-konkan-green-primary hover:border-konkan-green-primary/40 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              More options…
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}