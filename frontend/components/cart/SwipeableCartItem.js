'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

const SWIPE_THRESHOLD = -80;
const UNDO_DELAY_MS = 5000;

export default function SwipeableCartItem({ item, onRemove, updateQuantity, onClose, variant = 'page' }) {
  const [pendingDelete, setPendingDelete] = useState(false);
  const x = useMotionValue(0);
  const undoTimerRef = useRef(null);

  const deleteOpacity = useTransform(x, [-80, -40, 0], [1, 0.6, 0]);
  const deleteScale = useTransform(x, [-80, -40, 0], [1, 0.8, 0.7]);
  const itemBg = useTransform(
    x,
    [-80, -40, 0],
    ['#FEE2E2', '#FEF3C7', 'rgba(255,255,255,0)']
  );

  const handleUndo = useCallback((toastId) => {
    toast.dismiss(toastId);
    clearTimeout(undoTimerRef.current);
    setPendingDelete(false);
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 });
  }, [x]);

  const commitDelete = useCallback(() => {
    onRemove(item.id);
  }, [item.id, onRemove]);

  const showUndoToast = useCallback(() => {
    setPendingDelete(true);

    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-white">
          {item.name} removed
        </span>
        <button
          onClick={() => handleUndo(t.id)}
          className="text-sm font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
        >
          Undo
        </button>
      </div>
    ), {
      duration: UNDO_DELAY_MS,
      style: {
        background: '#1F2937',
        color: '#F9FAFB',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      },
      iconTheme: { primary: '#EF4444', secondary: '#FFF' },
    });

    undoTimerRef.current = setTimeout(() => {
      commitDelete();
    }, UNDO_DELAY_MS + 200);
  }, [item.name, handleUndo, commitDelete]);

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      animate(x, -400, { type: 'spring', stiffness: 300, damping: 30 }).then(() => {
        showUndoToast();
      });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }, [x, showUndoToast]);

  const handleDeleteTap = useCallback(() => {
    animate(x, -400, { type: 'spring', stiffness: 300, damping: 30 }).then(() => {
      showUndoToast();
    });
  }, [x, showUndoToast]);

  if (pendingDelete) return null;

  const isDrawer = variant === 'drawer';

  return (
    <div className="relative rounded-xl overflow-hidden select-none">
      {/* Red delete background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-xl"
        style={{
          opacity: deleteOpacity,
          scale: deleteScale,
          background: 'linear-gradient(90deg, #DC2626, #EF4444)',
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">Delete</span>
        </div>
      </motion.div>

      {/* Draggable cart item */}
      <motion.div
        className={`relative flex gap-3 ${isDrawer ? 'p-3 bg-konkan-cream/50 hover:bg-konkan-cream' : 'p-4 bg-white card hover:shadow-md'} rounded-xl transition-colors z-10 touch-pan-y`}
        style={{ x, backgroundColor: isDrawer ? itemBg : undefined }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
      >
        {/* Image */}
        <div className={`relative shrink-0 rounded-lg overflow-hidden bg-konkan-cream ${isDrawer ? 'w-20 h-20' : 'w-20 h-20 md:w-24 md:h-24'}`}>
          {item.image ? (
            <Image src={item.image} alt={item.name} fill sizes={isDrawer ? '80px' : '96px'} className="object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-konkan-text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${item.slug}`}
            onClick={onClose}
            className={`font-semibold text-konkan-text-primary hover:text-konkan-green-primary transition-colors line-clamp-1 ${isDrawer ? 'text-sm' : 'font-display'}`}
          >
            {item.name}
          </Link>
          {item.variant_name && (
            <p className="text-xs text-konkan-text-secondary mt-0.5">{item.variant_name}: {item.variant_value}</p>
          )}
          <div className={`flex items-center gap-2 ${isDrawer ? 'mt-2' : 'mt-2'}`}>
            <span className={`${isDrawer ? 'text-xs' : 'font-bold'} text-konkan-saffron`}>
              ₹{item.price}{!isDrawer && ' each'}
            </span>
            {!isDrawer && item.mrp > item.price && (
              <span className="text-xs text-konkan-text-secondary line-through">₹{item.mrp}</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            {/* Remove button — hidden on mobile (swipe instead), visible on desktop */}
            <button
              onClick={handleDeleteTap}
              className={`px-2 py-0.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors hidden lg:flex items-center gap-1 ${isDrawer ? '' : 'py-1 px-2.5'}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Remove
            </button>
            {/* Quantity */}
            <div className={`flex items-center border border-konkan-sand rounded-lg ${isDrawer ? 'bg-white' : ''}`}>
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className={`${isDrawer ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'} text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors rounded-l-lg`}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className={`${isDrawer ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} font-medium border-x border-konkan-sand tabular-nums ${!isDrawer ? 'min-w-[32px] text-center' : ''}`}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className={`${isDrawer ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'} text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors rounded-r-lg`}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="text-right shrink-0">
          <p className={`${isDrawer ? 'text-sm' : 'font-bold text-konkan-text-primary'}`}>₹{item.price * item.quantity}</p>
        </div>
      </motion.div>
    </div>
  );
}
