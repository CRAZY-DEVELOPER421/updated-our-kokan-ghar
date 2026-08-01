'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Button from '@/components/ui/Button';

// ── Aspect ratio presets ──
const ASPECT_PRESETS = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Free', value: null },
];

const OUTPUT_SIZE = 512;

/**
 * Custom canvas-based image cropper (no external dependency).
 *
 * Props:
 *   - src: image data URL / object URL to crop
 *   - onCancel: () => void
 *   - onConfirm: (blob) => void — cropped PNG blob
 */
export default function LogoCropper({ src, onCancel, onConfirm }) {
  const imageRef = useRef(null);       // loaded <img>
  const [imgMeta, setImgMeta] = useState(null); // { w, h }
  const [aspect, setAspect] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // in viewport px (image center drift)
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null); // { px, py, ox, oy }
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({ w: 320, h: 320 });

  // Load image once + lock body scroll while modal is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImgMeta({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = src;
    return () => {
      document.body.style.overflow = prevOverflow;
      img.onload = null;
    };
  }, [src]);

  // Measure the visible crop box (derives height from the chosen aspect ratio)
  const measureViewport = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = aspect == null ? el.clientHeight : Math.round(w / aspect);
    setViewport({ w, h });
  }, [aspect]);

  // Re-measure + reset pan/zoom whenever aspect changes (measureViewport identity
  // changes exactly when aspect changes); ResizeObserver only re-measures so it
  // never wipes the user's pan/zoom on window resizes.
  useEffect(() => {
    measureViewport();
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const ro = new ResizeObserver(measureViewport);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureViewport]);

  // ── Geometry ──
  const { w: vw, h: vh } = viewport;
  const imgW = imgMeta?.w || 1;
  const imgH = imgMeta?.h || 1;

  // Base scale so the image always covers the viewport
  const baseScale = Math.max(vw / imgW, vh / imgH);
  const scale = baseScale * zoom;
  const dispW = imgW * scale;
  const dispH = imgH * scale;

  // Clamp offset so the image never leaves the crop box
  const maxX = Math.max(0, (dispW - vw) / 2);
  const maxY = Math.max(0, (dispH - vh) / 2);
  const ox = Math.min(maxX, Math.max(-maxX, offset.x));
  const oy = Math.min(maxY, Math.max(-maxY, offset.y));

  // ── Drag handlers ──
  const onPointerDown = (e) => {
    if (!imgMeta) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
    setDragStart({ px: e.clientX, py: e.clientY, ox, oy });
  };
  const onPointerMove = (e) => {
    if (!dragging || !dragStart) return;
    setOffset({
      x: dragStart.ox + (e.clientX - dragStart.px),
      y: dragStart.oy + (e.clientY - dragStart.py),
    });
  };
  const endDrag = () => { setDragging(false); setDragStart(null); };

  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => Math.min(6, Math.max(1, z * factor)));
  };

  const changeZoom = (z) => setZoom(Math.min(6, Math.max(1, z)));

  // ── Crop & export ──
  const handleConfirm = () => {
    if (!imageRef.current || !imgMeta) return;
    const canvas = document.createElement('canvas');
    const outW = OUTPUT_SIZE;
    const outH = aspect == null ? Math.round((OUTPUT_SIZE * vh) / vw) : Math.round(OUTPUT_SIZE / aspect);
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');

    // Crop region inside the original image (in image pixels)
    const cropW = vw / scale;
    const cropH = vh / scale;
    const cropX = (imgW - cropW) / 2 - ox / scale;
    const cropY = (imgH - cropH) / 2 - oy / scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageRef.current, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
      else onCancel();
    }, 'image/png');
  };

  const freeHeight = aspect == null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Crop Logo</h2>
          <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Viewport */}
        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onWheel={onWheel}
          className={`relative w-full bg-slate-900 rounded-xl overflow-hidden select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            aspectRatio: aspect == null ? undefined : String(aspect),
            height: aspect == null ? 320 : undefined,
            touchAction: 'none',
          }}
        >
          {/* Draw the image using the same math as the export */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `translate(${ox}px, ${oy}px) scale(${scale})`, transformOrigin: 'center' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Crop preview" className="max-w-none" draggable={false}
              style={{ width: imgW, height: imgH }} />
          </div>

          {/* Crop grid overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ width: vw, height: freeHeight ? '100%' : vh, margin: 'auto', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}>
            <div className="absolute inset-0 border-2 border-white/80">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
            </div>
          </div>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM8 10h6" /></svg>
          <input
            type="range"
            min="1"
            max="6"
            step="0.05"
            value={zoom}
            onChange={e => changeZoom(parseFloat(e.target.value))}
            className="flex-1 accent-emerald-600"
          />
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM8 10h6m-3-3v6" /></svg>
          <span className="text-xs text-slate-500 w-10 text-right tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Aspect presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 mr-1">Aspect:</span>
          {ASPECT_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => setAspect(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${aspect === p.value ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={!imgMeta}>Crop & Save</Button>
        </div>
      </div>
    </div>
  );
}
