'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ImageCropper from '@/components/ImageCropper';

const HEADING_TYPES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const blockLabel = (b) => {
  if (b.type === 'badge') return 'Badge';
  if (b.type === 'p') return 'Description';
  if (b.type === 'button') return `Button · ${b.variant === 'ghost' ? 'Ghost' : 'Primary'}`;
  return b.type.toUpperCase();
};

const blockPlaceholder = (b) => {
  if (b.type === 'badge') return 'Badge text (e.g. Seasonal)';
  if (b.type === 'p') return 'Write description text...';
  if (/^h[1-6]$/.test(b.type)) return `Write heading (${b.type.toUpperCase()}) text...`;
  return 'Button text (e.g. Shop Now)';
};

// ── Block editor row ──
function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{blockLabel(block)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp} disabled={isFirst} title="Move up"
            className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>
          <button
            onClick={onMoveDown} disabled={isLast} title="Move down"
            className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button
            onClick={onDelete} title="Delete block"
            className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {block.type === 'button' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={block.text || ''}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Button text (e.g. Shop Now)"
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <input
            value={block.link || ''}
            onChange={(e) => onChange({ link: e.target.value })}
            placeholder="Link URL (e.g. /categories/... or https://)"
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <select
            value={block.variant || 'primary'}
            onChange={(e) => onChange({ variant: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="primary">Primary (solid green)</option>
            <option value="ghost">Ghost (outline / Learn More)</option>
          </select>
        </div>
      ) : (
        <textarea
          rows={block.type === 'p' ? 3 : 2}
          value={block.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={blockPlaceholder(block)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      )}
    </div>
  );
}

// ── Preview renderer — mirrors the storefront hero exactly ──
const headingSizes = { h1: 'text-4xl', h2: 'text-3xl', h3: 'text-2xl', h4: 'text-xl', h5: 'text-lg', h6: 'text-base' };

function PreviewBlock({ block }) {
  if (!block.text) return null;
  if (block.type === 'badge') {
    return <span className="inline-block self-start px-3.5 py-1 rounded-full bg-konkan-saffron text-white text-xs font-semibold uppercase tracking-wide mb-4">{block.text}</span>;
  }
  if (/^h[1-6]$/.test(block.type)) {
    const Tag = block.type;
    return <Tag className={`font-display font-bold text-white leading-tight ${headingSizes[block.type]} mb-3`}>{block.text}</Tag>;
  }
  if (block.type === 'p') {
    return <p className="text-white/85 text-base leading-relaxed max-w-xl mb-5">{block.text}</p>;
  }
  if (block.type === 'button') {
    return (
      <span className={`inline-flex items-center gap-2 whitespace-nowrap px-6 py-3 rounded-lg text-sm font-semibold ${block.variant === 'ghost' ? 'border border-white/70 text-white' : 'bg-konkan-green-primary text-white'}`}>
        {block.text}
      </span>
    );
  }
  return null;
}

// Group consecutive button blocks into one horizontal row so all buttons sit
// on the SAME line with a gap between them — never stacked, never wrapped.
function groupBlocks(blocks = []) {
  return blocks.reduce((acc, block) => {
    if (block.type === 'button') {
      const last = acc[acc.length - 1];
      if (last && last.type === 'buttons') last.buttons.push(block);
      else acc.push({ type: 'buttons', buttons: [block] });
    } else {
      acc.push({ type: 'single', block });
    }
    return acc;
  }, []);
}

// ── Main builder ──
export default function HeroSlideBuilder({ slideId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!slideId);
  const [mediaType, setMediaType] = useState('image');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [videoCropOpen, setVideoCropOpen] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoCaptureRef = useRef(null);

  // Load existing slide in edit mode
  useEffect(() => {
    if (!slideId) return;
    (async () => {
      try {
        const res = await api.get('/hero-slides/all');
        const slide = res.data.data?.slides?.find((s) => s.id === Number(slideId));
        if (!slide) { toast.error('Slide not found.'); router.push('/hero-sliders'); return; }
        setMediaType(slide.media_type || 'image');
        setImageUrl(slide.image_url || '');
        setVideoUrl(slide.video_url || '');
        // Older slides may have blocks saved WITHOUT an id — normalize them
        // here so React keys stay unique and update/delete-by-id can never
        // match multiple blocks at once.
        setBlocks(
          (slide.blocks || []).map((b, i) => ({ ...b, id: b.id || `block-${Date.now()}-${i}` }))
        );
        setSortOrder(slide.sort_order || 0);
        setIsActive(!!slide.is_active);
      } catch {
        toast.error('Failed to load slide.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slideId, router]);

  // ── Block operations ──
  const addBlock = (type) => setBlocks((b) => [...b, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, text: '', link: '', variant: 'primary' }]);
  const updateBlock = (id, patch) => setBlocks((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeBlock = (id) => setBlocks((b) => b.filter((x) => x.id !== id));
  const moveBlock = (id, dir) => setBlocks((b) => {
    const i = b.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= b.length) return b;
    const copy = [...b];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });

  // ── Image: pick → crop modal → upload cropped blob ──
  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = async (blob) => {
    try {
      const fd = new FormData();
      fd.append('image', blob, 'hero-image.png');
      const res = await api.post('/upload/image', fd);
      setImageUrl(res.data.data.url);
      toast.success('Image uploaded.');
    } catch {
      toast.error('Image upload failed.');
    } finally {
      setCropSrc(null);
    }
  };

  // ── Video: direct upload ──
  const handleVideoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('video', file);
      const res = await api.post('/upload/video', fd);
      setVideoUrl(res.data.data.url);
      toast.success('Video uploaded.');
    } catch {
      toast.error('Video upload failed (mp4/webm/mov, max 200MB).');
    }
    e.target.value = '';
  };

  // ── Video frame crop: capture current frame → crop via ImageCropper →
  //    upload as the video poster (image_url). ──
  const handleCaptureFrame = () => {
    const v = videoCaptureRef.current;
    if (!v || !v.videoWidth) { toast.error('Load the video and seek to a frame first.'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d').drawImage(v, 0, 0);
    setCropSrc(canvas.toDataURL('image/png'));
    setVideoCropOpen(false);
  };

  // ── Save ──
  const handleSave = async () => {
    if (blocks.length === 0) { toast.error('Add at least one block (heading/description/button).'); return; }
    if (mediaType === 'image' && !imageUrl) { toast.error('Upload a background image (or switch to video).'); return; }
    if (mediaType === 'video' && !videoUrl) { toast.error('Upload a background video (or switch to image).'); return; }
    setSaving(true);
    const payload = {
      media_type: mediaType,
      // For videos, image_url holds the cropped poster frame (optional)
      image_url: imageUrl,
      video_url: mediaType === 'video' ? videoUrl : null,
      blocks,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive ? 1 : 0,
    };
    try {
      if (slideId) await api.put(`/hero-slides/${slideId}`, payload);
      else await api.post('/hero-slides', payload);
      toast.success('Hero slide saved!');
      router.push('/hero-sliders');
    } catch {
      toast.error('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading slide...</div>;
  }

  const previewMedia = mediaType === 'video' && videoUrl ? videoUrl : imageUrl;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{slideId ? 'Edit Hero Slide' : 'New Hero Slide'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build the slide block-by-block — headings, descriptions and buttons with links.</p>
        </div>
        <Link href="/hero-sliders" className="text-sm font-medium text-gray-500 hover:text-gray-800">← Back</Link>
      </div>

      {/* ══ Media (image / video) ══ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Background Media</h2>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setMediaType('image')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mediaType === 'image' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Image
            </button>
            <button
              onClick={() => setMediaType('video')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mediaType === 'video' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Video
            </button>
          </div>
        </div>

        {mediaType === 'image' ? (
          <div className="flex items-center gap-4">
            <div className="w-40 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Hero background" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] text-gray-400">No image</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg bg-konkan-green-primary text-white text-xs font-semibold hover:bg-konkan-green-dark transition-colors"
                >
                  Upload & Crop Image
                </button>
                {imageUrl && (
                  <button
                    onClick={() => setImageUrl('')}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400">JPG/PNG/WebP — crop with zoom, pan & aspect presets (16:9 recommended).</p>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-40 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {videoUrl ? (
                <video src={videoUrl} muted className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] text-gray-400">No video</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg bg-konkan-green-primary text-white text-xs font-semibold hover:bg-konkan-green-dark transition-colors"
                >
                  Upload Video
                </button>
                {videoUrl && (
                  <>
                    <button
                      onClick={() => setVideoCropOpen(true)}
                      className="px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 transition-colors"
                    >
                      Crop Video Frame
                    </button>
                    <button
                      onClick={() => setVideoUrl('')}
                      className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
              <p className="text-[11px] text-gray-400">MP4/WebM/MOV, up to 200MB. Autoplays muted on the site. Use “Crop Video Frame” to capture a poster image from the video.</p>
              <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoPick} />
            </div>
          </div>
        )}
      </div>

      {/* ══ Block toolbar ══ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800">Content Blocks</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => addBlock('badge')} className="px-3 py-2 rounded-lg bg-slate-100 text-gray-700 text-xs font-semibold hover:bg-slate-200 transition-colors">+ Badge</button>
          {HEADING_TYPES.map((h) => (
            <button key={h} onClick={() => addBlock(h)} className="px-3 py-2 rounded-lg bg-slate-100 text-gray-700 text-xs font-semibold hover:bg-slate-200 transition-colors uppercase">+ {h}</button>
          ))}
          <button onClick={() => addBlock('p')} className="px-3 py-2 rounded-lg bg-slate-100 text-gray-700 text-xs font-semibold hover:bg-slate-200 transition-colors">+ Description</button>
          <button onClick={() => addBlock('button')} className="px-3 py-2 rounded-lg bg-konkan-green-primary text-white text-xs font-semibold hover:bg-konkan-green-dark transition-colors">+ Button (with link)</button>
        </div>
        <p className="text-[11px] text-gray-400">Click any button to add a block — add as many as you want, then type, edit, reorder (↑↓) or delete each block.</p>

        {blocks.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No blocks yet. Add a heading, description or button above.</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((block, i) => (
              <BlockEditor
                key={block.id || `block-${i}`}
                block={block}
                onChange={(patch) => updateBlock(block.id, patch)}
                onDelete={() => removeBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, -1)}
                onMoveDown={() => moveBlock(block.id, 1)}
                isFirst={i === 0}
                isLast={i === blocks.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══ Slide settings ══ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 py-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-emerald-600"
          />
          Active (visible on website)
        </label>
      </div>

      {/* ══ Live preview ══ */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-2">Live Preview</h2>
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-900">
          {previewMedia ? (
            // Only render <video> when a real video_url exists — if the slide
            // is in video mode but has no video yet, fall back to the poster
            // image instead of an empty src.
            mediaType === 'video' && videoUrl ? (
              <video src={videoUrl} autoPlay muted loop playsInline preload="auto" disablePictureInPicture controls={false} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              Upload an image or video to see the preview background
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />

          <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-10">
            <div className="max-w-xl">
              {groupBlocks(blocks).map((group, gi) =>
                group.type === 'buttons' ? (
                  <div key={`btns-${gi}`} className={`flex flex-nowrap items-center gap-3 ${gi > 0 ? 'mt-3' : ''}`}>
                    {group.buttons.map((b, bi) => (
                      <PreviewBlock key={b.id || `btn-${gi}-${bi}`} block={b} />
                    ))}
                  </div>
                ) : (
                  <PreviewBlock key={group.block.id || `blk-${gi}`} block={group.block} />
                )
              )}
              {blocks.length === 0 && <p className="text-white/60 text-sm">Add blocks to preview them here.</p>}
            </div>
          </div>

        </div>
      </div>

      {/* ══ Actions ══ */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-konkan-green-primary text-white text-sm font-semibold hover:bg-konkan-green-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : slideId ? 'Save Changes' : 'Create Slide'}
        </button>
        <Link
          href="/hero-sliders"
          className="px-6 py-3 rounded-xl border border-slate-300 text-gray-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {/* ══ Video frame capture modal ══ */}
      {videoCropOpen && videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-2xl space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Crop Video Frame</h3>
              <button
                onClick={() => setVideoCropOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs text-gray-500">Seek to the frame you want, then capture it — the cropped frame becomes the video’s poster (shown before playback and on the slider list).</p>
            <video
              ref={videoCaptureRef}
              src={videoUrl}
              controls
              muted
              playsInline
              className="w-full rounded-xl bg-black max-h-72"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setVideoCropOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-gray-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCaptureFrame}
                className="px-4 py-2 rounded-lg bg-konkan-green-primary text-white text-sm font-semibold hover:bg-konkan-green-dark transition-colors"
              >
                Capture Frame & Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          title="Crop Hero Image"
          outputSize={1600}
          defaultAspect={16 / 9}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
