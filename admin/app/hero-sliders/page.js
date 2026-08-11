'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const slideSummary = (slide) => {
  const badge = slide.blocks?.find((b) => b.type === 'badge')?.text;
  const heading = slide.blocks?.find((b) => /^h[1-6]$/.test(b.type))?.text;
  return { badge, heading: heading || 'Untitled slide' };
};

export default function AdminHeroSlidersPage() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-hero-slides'],
    queryFn: async () => (await api.get('/hero-slides/all')).data.data,
  });

  const slides = data?.slides || [];

  const handleDelete = async (id) => {
    if (!confirm('Delete this hero slide?')) return;
    try {
      await api.delete(`/hero-slides/${id}`);
      toast.success('Hero slide deleted.');
      invalidate();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const toggleActive = async (slide) => {
    try {
      await api.put(`/hero-slides/${slide.id}`, { is_active: slide.is_active ? 0 : 1 });
      toast.success(slide.is_active ? 'Slide hidden' : 'Slide published');
      invalidate();
    } catch {
      toast.error('Failed to update.');
    }
  };

  // Swap sort_order with the neighbour slide
  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= slides.length) return;
    const a = slides[index];
    const b = slides[j];
    try {
      await Promise.all([
        api.put(`/hero-slides/${a.id}`, { sort_order: b.sort_order }),
        api.put(`/hero-slides/${b.id}`, { sort_order: a.sort_order }),
      ]);
      invalidate();
    } catch {
      toast.error('Reorder failed.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Sliders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{slides.length} slide{slides.length === 1 ? '' : 's'} · shown on the homepage in order</p>
        </div>
        <Link
          href="/hero-sliders/create"
          className="inline-flex items-center px-4 py-2 bg-konkan-green-primary text-white text-sm font-medium rounded-xl hover:bg-konkan-green-dark transition-colors"
        >
          + New Slider
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : slides.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 mb-3">No hero sliders yet.</p>
          <Link href="/hero-sliders/create" className="inline-flex px-4 py-2 bg-konkan-green-primary text-white text-sm font-medium rounded-xl hover:bg-konkan-green-dark">
            + Create your first slider
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, i) => {
            const { badge, heading } = slideSummary(slide);
            return (
              <div key={slide.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="w-28 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 relative">
                  {slide.media_type === 'video' && slide.video_url ? (
                    <video src={slide.video_url} muted className="w-full h-full object-cover" />
                  ) : slide.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slide.image_url} alt={heading} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">No media</div>
                  )}
                  {!slide.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] font-bold text-white">HIDDEN</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{heading}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {badge && <span className="text-[10px] px-2 py-0.5 bg-konkan-saffron/10 text-konkan-saffron rounded-full font-medium">{badge}</span>}
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">{slide.blocks?.length || 0} blocks</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">{slide.media_type}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${slide.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      {slide.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-gray-400">Order: {slide.sort_order}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex flex-col gap-0.5 mr-1">
                    <button
                      onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
                      className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={() => move(i, 1)} disabled={i === slides.length - 1} title="Move down"
                      className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${slide.is_active ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                  >
                    {slide.is_active ? 'Hide' : 'Publish'}
                  </button>
                  <Link href={`/hero-sliders/${slide.id}`} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-konkan-cream text-konkan-green-primary hover:bg-konkan-green-primary/10">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
