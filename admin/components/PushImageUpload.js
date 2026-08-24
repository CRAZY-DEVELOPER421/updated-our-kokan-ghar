'use client';

import { useState, useRef, useCallback } from 'react';
import ImageCropper from '@/components/ImageCropper';
import api from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * PushImageUpload — Drag & drop / browse / crop image for push notifications.
 *
 * Props:
 *   - value: string (image URL)
 *   - onChange: (url: string) => void
 */
export default function PushImageUpload({ value, onChange }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  // ── Handle file selection (browse or drop) ──
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreviewSrc(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Drag & Drop handlers ──
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  };

  // ── Browse click ──
  const onBrowseClick = () => inputRef.current?.click();
  const onFileChange = (e) => handleFile(e.target.files?.[0]);

  // ── Crop confirmed — upload the cropped blob ──
  const onCropConfirm = async (blob) => {
    setPreviewSrc(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', blob, 'push-image.png');
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        onChange(url);
        toast.success('Image uploaded!');
      } else {
        toast.error('Upload succeeded but no URL returned');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onCropCancel = () => setPreviewSrc(null);

  const onRemove = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Image <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      {value ? (
        /* ── Uploaded image preview ── */
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-40 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={onBrowseClick}
              className="p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 transition-all"
              title="Replace image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm border border-gray-200 text-red-500 hover:text-red-700 transition-all"
              title="Remove image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onBrowseClick}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200
            flex flex-col items-center justify-center py-8 px-4 text-center
            ${dragActive
              ? 'border-green-500 bg-green-50 scale-[1.02]'
              : 'border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50/50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${dragActive ? 'bg-green-100' : 'bg-gray-200'}`}>
            <svg className={`w-6 h-6 transition-colors ${dragActive ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">
            {dragActive ? 'Drop image here' : 'Browse or drag & drop'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPG, WebP — max 5 MB
          </p>
          <button
            type="button"
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 transition-colors"
            onClick={(e) => { e.stopPropagation(); onBrowseClick(); }}
          >
            Browse Files
          </button>
        </div>
      )}

      {/* ── Uploading indicator ── */}
      {uploading && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading & cropping...
        </div>
      )}

      {/* ── Hidden URL input for direct URL paste ── */}
      {!value && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">or</span>
          <input
            type="url"
            value=""
            onChange={(e) => { if (e.target.value.trim()) onChange(e.target.value.trim()); }}
            placeholder="Paste image URL..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
      )}

      {/* ── Crop modal ── */}
      {previewSrc && (
        <ImageCropper
          src={previewSrc}
          onCancel={onCropCancel}
          onConfirm={onCropConfirm}
          title="Crop Notification Image"
          outputSize={1200}
          defaultAspect={16 / 9}
        />
      )}
    </div>
  );
}
