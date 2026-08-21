'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getImageUrl, getStorefrontUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import CampaignPreview from '@/components/CampaignPreview';

const FESTIVE_COLORS = [
  { value: '#2D6A4F', label: 'Konkan Green' },
  { value: '#E87722', label: 'Saffron' },
  { value: '#7F1D1D', label: 'Maroon' },
  { value: '#B45309', label: 'Gold' },
  { value: '#BE185D', label: 'Rose' },
  { value: '#6D28D9', label: 'Purple' },
  { value: '#0F766E', label: 'Teal' },
  { value: '#1D4ED8', label: 'Festive Blue' },
];

const SECTION_TYPES = [
  { value: 'products', label: 'Products', desc: 'Product cards — 5 per row (grid) or horizontal scroll' },
  { value: 'story', label: 'Story', desc: 'Write a story / text block (HTML allowed)' },
  { value: 'blog', label: 'Blog', desc: 'Link existing blog posts from your blog library' },
  { value: 'overview', label: 'Overview', desc: 'Highlighted overview text block' },
];

const DEFAULT_SECTION_TITLES = {
  products: 'Shop the Collection',
  story: 'Our Story',
  blog: 'From the Blog',
  overview: 'Overview',
};

const BG_TYPES = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'color', label: 'Color' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
];

const defaultCampaign = {
  name: '', slug: '', tagline: '', description: '',
  theme_color: '#2D6A4F', banner_image_url: '', mobile_banner_image_url: '',
  meta_title: '', meta_description: '', starts_at: '', ends_at: '',
  sort_order: 0, is_active: 1,
  page_bg_type: 'transparent', page_bg_color: '#2D6A4F', page_bg_image: '', page_bg_video: '',
};

const defaultSection = (type) => ({
  id: null,
  section_type: type,
  title: DEFAULT_SECTION_TITLES[type] || '',
  subtitle: '',
  content: '',
  layout: 'grid',
  bg_type: 'transparent',
  bg_color: '#2D6A4F',
  bg_image: '',
  bg_video: '',
  products: [],
  blogs: [],
});

function Section({ title, desc, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-all">
      <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
      {desc && <p className="text-[11px] text-slate-500 mt-0.5 mb-3">{desc}</p>}
      {!desc && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function Toggle({ value, onChange, label, desc }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-1.5">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {desc && <p className="text-[11px] text-slate-500">{desc}</p>}
      </div>
      <button type="button" onClick={onChange} className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${value ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );
}

const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white";
const labelClass = "block text-xs font-medium text-slate-600 mb-1";

// Simple client-side slugifier (mirrors the backend slugify package behavior)
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Upload an image via the shared upload endpoint
async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await api.post('/upload/image', fd);
  return res.data.data.url;
}

/* ── Background builder (page + sections) ────────────────── */
function BgBuilder({ bg, onChange }) {
  const fileRef = useRef(null);

  const set = (patch) => onChange({ ...bg, ...patch });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {BG_TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => set({ type: t.value })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              bg.type === t.value
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {bg.type === 'color' && (
        <div className="flex items-center gap-2 mt-2.5">
          <input
            type="color"
            value={bg.color || '#2D6A4F'}
            onChange={e => set({ color: e.target.value })}
            className="w-9 h-9 rounded border border-slate-200 cursor-pointer"
          />
          <input
            className={`${inputClass} w-28 font-mono`}
            value={bg.color || ''}
            onChange={e => set({ color: e.target.value })}
            placeholder="#2D6A4F"
          />
          <span className="text-[11px] text-slate-400">Solid background color</span>
        </div>
      )}

      {bg.type === 'image' && (
        <div className="mt-2.5 flex items-center gap-3">
          <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
            {bg.image ? (
              <img src={getImageUrl(bg.image)} alt="Background" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-slate-400">No image</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-konkan-green-primary text-white text-xs font-semibold hover:bg-konkan-green-dark transition-colors">
              Upload
            </button>
            {bg.image && (
              <button type="button" onClick={() => set({ image: '' })} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
                Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  const url = await uploadImage(file);
                  set({ image: url });
                  toast.success('Background image uploaded.');
                } catch { toast.error('Image upload failed.'); }
              }}
            />
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Cover image — fills the whole area</span>
        </div>
      )}

      {bg.type === 'video' && (
        <div className="mt-2.5">
          <input
            className={inputClass}
            value={bg.video || ''}
            onChange={e => set({ video: e.target.value })}
            placeholder="https://... .mp4 (video URL, plays muted & looping)"
          />
          {bg.video && (
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Video background set — plays muted & looping
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Product picker inside a section ─────────────────────── */
function ProductPicker({ items, onAdd, onRemove, onMove }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/admin/products', { params: { search, limit: 8 } });
        const list = (res.data.data?.products || []).filter(p => !items.some(s => Number(s.product_id) === Number(p.id)));
        setResults(list);
      } catch { setResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, items]);

  const add = (p) => {
    onAdd({ product_id: p.id, name: p.name, price: p.price, primary_image: p.image });
    setSearch('');
    setResults([]);
    searchRef.current?.focus();
  };

  return (
    <div>
      {items.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {items.map((s, i) => (
            <div key={`${s.product_id}-${i}`} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 bg-white flex items-center justify-center shrink-0">
                {s.primary_image ? (
                  <img src={getImageUrl(s.primary_image)} alt={s.name || 'Product'} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </div>
              <p className="text-xs font-medium text-slate-900 truncate flex-1">{s.name || `Product #${s.product_id}`}</p>
              <span className="text-[10px] text-slate-400 shrink-0">{items.length > 1 ? `#${i + 1}` : ''}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center" title="Move up">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button type="button" onClick={() => onMove(i, 1)} disabled={i === items.length - 1} className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center" title="Move down">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button type="button" onClick={() => onRemove(s.product_id)} className="w-6 h-6 rounded-md bg-white border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center" title="Remove">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products to add to this section…"
          className={`${inputClass} pl-9`}
        />
      </div>
      {search.trim() && (
        <div className="mt-2 border border-slate-200 rounded-lg max-h-52 overflow-y-auto bg-white">
          {searching ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : results.length === 0 ? (
            <p className="p-3 text-xs text-slate-400 text-center">No matching products found.</p>
          ) : (
            results.map(p => (
              <button key={p.id} type="button" onClick={() => add(p)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-emerald-50/60 transition-colors">
                <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
                  {p.image ? <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" /> : <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                </div>
                <span className="text-xs text-slate-700 truncate flex-1">{p.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">₹{Number(p.price).toLocaleString('en-IN')}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Blog picker inside a section ────────────────────────── */
function BlogPicker({ items, onAdd, onRemove, onMove }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/cms/blogs', { params: { all: 1, search, limit: 8 } });
        const list = (res.data.data?.blogs || []).filter(b => !items.some(s => Number(s.blog_id) === Number(b.id)));
        setResults(list);
      } catch { setResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, items]);

  const add = (b) => {
    onAdd({ blog_id: b.id, title: b.title, slug: b.slug, hero_image: b.hero_image, excerpt: b.excerpt });
    setSearch('');
    setResults([]);
    searchRef.current?.focus();
  };

  return (
    <div>
      {items.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {items.map((b, i) => (
            <div key={`${b.blog_id}-${i}`} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 bg-white flex items-center justify-center shrink-0">
                {b.hero_image ? (
                  <img src={getImageUrl(b.hero_image)} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 w-full h-full flex items-center justify-center">{(b.title || 'B').charAt(0)}</span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-900 truncate flex-1">{b.title}</p>
              <span className="text-[10px] text-slate-400 shrink-0">{items.length > 1 ? `#${i + 1}` : ''}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => onMove(i, -1)} disabled={i === 0} className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center" title="Move up">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button type="button" onClick={() => onMove(i, 1)} disabled={i === items.length - 1} className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center" title="Move down">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button type="button" onClick={() => onRemove(b.blog_id)} className="w-6 h-6 rounded-md bg-white border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center" title="Remove">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search blog posts to add to this section…"
          className={`${inputClass} pl-9`}
        />
      </div>
      {search.trim() && (
        <div className="mt-2 border border-slate-200 rounded-lg max-h-52 overflow-y-auto bg-white">
          {searching ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : results.length === 0 ? (
            <p className="p-3 text-xs text-slate-400 text-center">No matching blog posts found.</p>
          ) : (
            results.map(b => (
              <button key={b.id} type="button" onClick={() => add(b)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-emerald-50/60 transition-colors">
                <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
                  {b.hero_image ? <img src={getImageUrl(b.hero_image)} alt={b.title} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 w-full h-full flex items-center justify-center">{(b.title || 'B').charAt(0)}</span>}
                </div>
                <span className="text-xs text-slate-700 truncate flex-1">{b.title}</span>
                <span className="text-[10px] text-slate-400 shrink-0">/blog/{b.slug}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function AdminCampaignEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [form, setForm] = useState(defaultCampaign);
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(false);
  const bannerInputRef = useRef(null);
  const mobileBannerInputRef = useRef(null);
  const sectionsEndRef = useRef(null);

  // Fetch campaign (edit mode)
  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['admin-campaign', id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await api.get(`/admin/campaigns/${id}`);
      return res.data.data.campaign;
    },
    enabled: !isNew,
    retry: 1,
  });

  // Populate form
  useEffect(() => {
    if (isNew) return;
    if (!campaignData) return;
    setForm({
      name: campaignData.name || '',
      slug: campaignData.slug || '',
      tagline: campaignData.tagline || '',
      description: campaignData.description || '',
      theme_color: campaignData.theme_color || '#2D6A4F',
      banner_image_url: campaignData.banner_image_url || '',
      mobile_banner_image_url: campaignData.mobile_banner_image_url || '',
      meta_title: campaignData.meta_title || '',
      meta_description: campaignData.meta_description || '',
      starts_at: campaignData.starts_at ? campaignData.starts_at.slice(0, 16) : '',
      ends_at: campaignData.ends_at ? campaignData.ends_at.slice(0, 16) : '',
      sort_order: campaignData.sort_order || 0,
      is_active: campaignData.is_active ?? 1,
      page_bg_type: campaignData.page_bg_type || 'transparent',
      page_bg_color: campaignData.page_bg_color || '#2D6A4F',
      page_bg_image: campaignData.page_bg_image || '',
      page_bg_video: campaignData.page_bg_video || '',
    });
    setSections((campaignData.sections || []).map(s => ({
      id: s.id || null,
      section_type: s.section_type || 'products',
      title: s.title || '',
      subtitle: s.subtitle || '',
      content: s.content || '',
      layout: s.layout === 'scroll' ? 'scroll' : 'grid',
      bg_type: s.bg_type || 'transparent',
      bg_color: s.bg_color || '#2D6A4F',
      bg_image: s.bg_image || '',
      bg_video: s.bg_video || '',
      products: (s.products || []).map(p => ({ product_id: p.product_id, name: p.name, price: p.price, primary_image: p.primary_image })),
      blogs: (s.blogs || []).map(b => ({ blog_id: b.blog_id, title: b.title, slug: b.slug, hero_image: b.hero_image, excerpt: b.excerpt })),
    })));
  }, [isNew, campaignData]);

  // Auto-slug from name until the admin edits the slug manually
  const updateField = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !slugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });
    setDirty(true);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Unsaved changes warning
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // ── Section helpers ──
  const updateSection = (index, patch) => {
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const moveSection = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= sections.length) return;
    setSections(prev => {
      const copy = [...prev];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
    setDirty(true);
  };

  const removeSection = (index) => {
    setSections(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const addSection = (type) => {
    setSections(prev => [...prev, defaultSection(type)]);
    setDirty(true);
    setTimeout(() => sectionsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  const addSectionProduct = (sectionIndex, product) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIndex) return s;
      if (s.products.some(p => Number(p.product_id) === Number(product.product_id))) return s;
      return { ...s, products: [...s.products, product] };
    }));
    setDirty(true);
  };

  const removeSectionProduct = (sectionIndex, productId) => {
    setSections(prev => prev.map((s, i) =>
      i === sectionIndex ? { ...s, products: s.products.filter(p => Number(p.product_id) !== Number(productId)) } : s
    ));
    setDirty(true);
  };

  const moveSectionProduct = (sectionIndex, index, dir) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIndex) return s;
      const j = index + dir;
      if (j < 0 || j >= s.products.length) return s;
      const copy = [...s.products];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return { ...s, products: copy };
    }));
    setDirty(true);
  };

  const addSectionBlog = (sectionIndex, blog) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIndex) return s;
      if (s.blogs.some(b => Number(b.blog_id) === Number(blog.blog_id))) return s;
      return { ...s, blogs: [...s.blogs, blog] };
    }));
    setDirty(true);
  };

  const removeSectionBlog = (sectionIndex, blogId) => {
    setSections(prev => prev.map((s, i) =>
      i === sectionIndex ? { ...s, blogs: s.blogs.filter(b => Number(b.blog_id) !== Number(blogId)) } : s
    ));
    setDirty(true);
  };

  const moveSectionBlog = (sectionIndex, index, dir) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIndex) return s;
      const j = index + dir;
      if (j < 0 || j >= s.blogs.length) return s;
      const copy = [...s.blogs];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return { ...s, blogs: copy };
    }));
    setDirty(true);
  };

  // ── Image upload (desktop / mobile banner) ──
  const handleBannerPick = async (e, which) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      updateField(which, url);
      toast.success('Banner uploaded.');
    } catch {
      toast.error('Image upload failed.');
    }
    e.target.value = '';
  };

  // ── Validation ──
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Campaign name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required (the page URL)';
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errs.slug = 'Use lowercase letters, numbers and hyphens only';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      tagline: form.tagline.trim() || null,
      description: form.description.trim() || null,
      theme_color: form.theme_color || '#2D6A4F',
      banner_image_url: form.banner_image_url || null,
      mobile_banner_image_url: form.mobile_banner_image_url || null,
      page_bg_type: form.page_bg_type || 'transparent',
      page_bg_color: form.page_bg_color || null,
      page_bg_image: form.page_bg_image || null,
      page_bg_video: form.page_bg_video || null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      starts_at: form.starts_at ? form.starts_at.replace('T', ' ').slice(0, 19) : null,
      ends_at: form.ends_at ? form.ends_at.replace('T', ' ').slice(0, 19) : null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active ? 1 : 0,
      sections: sections.map(s => ({
        id: s.id || null,
        section_type: s.section_type,
        title: s.title?.trim() || null,
        subtitle: s.subtitle?.trim() || null,
        content: s.content || null,
        layout: s.layout === 'scroll' ? 'scroll' : 'grid',
        bg_type: s.bg_type || 'transparent',
        bg_color: s.bg_color || null,
        bg_image: s.bg_image || null,
        bg_video: s.bg_video || null,
        product_ids: s.products.map(p => Number(p.product_id)),
        blog_ids: s.blogs.map(b => Number(b.blog_id)),
      })),
    };
    try {
      if (isNew) {
        const res = await api.post('/admin/campaigns', payload);
        toast.success('Campaign created!');
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
        router.push(`/campaigns/${res.data.data.id}`);
      } else {
        await api.put(`/admin/campaigns/${id}`, payload);
        toast.success('Campaign updated!');
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['admin-campaign', id] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save campaign.');
    }
    setSaving(false);
  };

  if (campaignLoading) {
    return <div className="text-center py-16 text-gray-500">Loading campaign...</div>;
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_500px] lg:gap-6 lg:items-start">
      {/* ══ Left: form ══ */}
      <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'New Festive Campaign' : 'Edit Campaign'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isNew
              ? 'Create a themed collection page (Ganesh Chaturthi, Diwali, Holi…) — full page background, unlimited sections, festive countdown.'
              : `Page URL: /campaign/${form.slug || '…'}`}
          </p>
        </div>
        <button onClick={() => router.push('/campaigns')} className="text-sm font-medium text-slate-500 hover:text-slate-800">← Back</button>
      </div>

      {/* ══ Identity ══ */}
      <Section title="Campaign Details" desc="The name, URL and festive tagline shown on the page.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Campaign Name *</label>
            <input className={inputClass} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Ganesh Chaturthi Special" />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={labelClass}>Slug (page URL) *</label>
            <input
              className={inputClass}
              value={form.slug}
              onChange={e => { setSlugTouched(true); updateField('slug', slugify(e.target.value)); }}
              placeholder="e.g. ganesh-chaturthi-special"
            />
            <p className="text-[10px] text-slate-400 mt-1">Page will be live at <span className="font-mono">/campaign/{form.slug || '…'}</span></p>
            {errors.slug && <p className="text-[11px] text-rose-500 mt-1">{errors.slug}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Tagline</label>
            <input className={inputClass} value={form.tagline} onChange={e => updateField('tagline', e.target.value)} placeholder="e.g. Modak ke liye sab kuch — fresh ingredients, delivered" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea rows={3} className={`${inputClass} resize-y`} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="A short paragraph about this festival collection…" />
          </div>
        </div>
      </Section>

      {/* ══ Page background (single, full page start→end) ══ */}
      <Section title="Full-Page Background" desc="One background for the ENTIRE page from top to bottom — perfect for festive scenes (e.g. banana trees on the sides with products on top). Leave Transparent for a clean white page.">
        <BgBuilder
          bg={{ type: form.page_bg_type, color: form.page_bg_color, image: form.page_bg_image, video: form.page_bg_video }}
          onChange={bg => {
            updateField('page_bg_type', bg.type);
            updateField('page_bg_color', bg.color || '');
            updateField('page_bg_image', bg.image || '');
            updateField('page_bg_video', bg.video || '');
          }}
        />
      </Section>

      {/* ══ Theming ══ */}
      <Section title="Festive Theme" desc="Colors that give the page its festive look — used for the hero fallback, countdown and buttons.">
        <div className="flex flex-wrap items-center gap-2">
          {FESTIVE_COLORS.map(color => (
            <button
              key={color.value}
              type="button"
              onClick={() => updateField('theme_color', color.value)}
              title={color.label}
              className={`w-9 h-9 rounded-full border-2 transition-all ${form.theme_color === color.value ? 'border-slate-900 scale-110 shadow-md' : 'border-slate-200 hover:scale-105'}`}
              style={{ backgroundColor: color.value }}
            />
          ))}
          <label className="flex items-center gap-2 ml-2 cursor-pointer">
            <span className="text-xs text-slate-500">Custom:</span>
            <input
              type="color"
              value={form.theme_color}
              onChange={e => updateField('theme_color', e.target.value)}
              className="w-9 h-9 rounded border border-slate-200 cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-500">{form.theme_color}</span>
          </label>
        </div>
      </Section>

      {/* ══ Banners ══ */}
      <Section title="Hero Banner" desc="Upload a festive banner. The desktop banner is shown on large screens; the mobile banner (optional) replaces it on phones.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Desktop banner */}
          <div>
            <label className={labelClass}>Desktop Banner</label>
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-28 flex items-center justify-center relative">
              {form.banner_image_url ? (
                <img src={getImageUrl(form.banner_image_url)} alt="Desktop banner" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] text-slate-400">No desktop banner</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button type="button" onClick={() => bannerInputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-konkan-green-primary text-white text-xs font-semibold hover:bg-konkan-green-dark transition-colors">
                Upload
              </button>
              {form.banner_image_url && (
                <button type="button" onClick={() => updateField('banner_image_url', '')} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
                  Remove
                </button>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleBannerPick(e, 'banner_image_url')} />
            </div>
          </div>

          {/* Mobile banner */}
          <div>
            <label className={labelClass}>Mobile Banner (optional)</label>
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-28 flex items-center justify-center relative">
              {form.mobile_banner_image_url ? (
                <img src={getImageUrl(form.mobile_banner_image_url)} alt="Mobile banner" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] text-slate-400">No mobile banner — falls back to desktop</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button type="button" onClick={() => mobileBannerInputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-konkan-green-primary text-white text-xs font-semibold hover:bg-konkan-green-dark transition-colors">
                Upload
              </button>
              {form.mobile_banner_image_url && (
                <button type="button" onClick={() => updateField('mobile_banner_image_url', '')} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
                  Remove
                </button>
              )}
              <input ref={mobileBannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleBannerPick(e, 'mobile_banner_image_url')} />
            </div>
          </div>
        </div>
      </Section>

      {/* ══ Page sections (unlimited) ══ */}
      <Section title="Page Sections" desc="Build the page block by block — add as many sections as you want. Each section can be products, a story, blog posts, or an overview, and each has its own background.">
        {sections.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center mb-4">
            <p className="text-xs text-slate-400">No sections yet — add your first section below.</p>
          </div>
        )}

        <div className="space-y-4">
          {sections.map((section, index) => {
            const typeMeta = SECTION_TYPES.find(t => t.value === section.section_type) || SECTION_TYPES[0];
            return (
              <div key={`${section.id || 'new'}-${index}`} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {/* Section header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: section.section_type === 'products' ? '#2D6A4F' : section.section_type === 'blog' ? '#1D4ED8' : section.section_type === 'overview' ? '#B45309' : '#7C3AED' }}>
                    {typeMeta.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Section {index + 1}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center" title="Move section up">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center" title="Move section down">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button type="button" onClick={() => { if (confirm(`Remove this ${typeMeta.label} section?`)) removeSection(index); }} className="w-7 h-7 rounded-md bg-white border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center" title="Delete section">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Title / subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Section Title</label>
                      <input className={inputClass} value={section.title} onChange={e => updateSection(index, { title: e.target.value })} placeholder={`e.g. ${DEFAULT_SECTION_TITLES[section.section_type] || 'Section title'}`} />
                    </div>
                    <div>
                      <label className={labelClass}>Subtitle (optional)</label>
                      <input className={inputClass} value={section.subtitle} onChange={e => updateSection(index, { subtitle: e.target.value })} placeholder="A short line under the title" />
                    </div>
                  </div>

                  {/* Products content */}
                  {section.section_type === 'products' && (
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-slate-600">Layout:</span>
                        <button
                          type="button"
                          onClick={() => updateSection(index, { layout: 'grid' })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${section.layout === 'grid' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                          title="5 products per row, extra products wrap below"
                        >
                          Grid — 5 per row
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSection(index, { layout: 'scroll' })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${section.layout === 'scroll' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                          title="Horizontal left-to-right scroll row"
                        >
                          Horizontal Scroll
                        </button>
                        <span className="text-[10px] text-slate-400">
                          {section.layout === 'grid'
                            ? 'Straight grid — 5 per row, more products stack below'
                            : 'Scrollable row — swipe / scroll left→right'}
                        </span>
                      </div>
                      <ProductPicker
                        items={section.products}
                        onAdd={p => addSectionProduct(index, p)}
                        onRemove={pid => removeSectionProduct(index, pid)}
                        onMove={(i, dir) => moveSectionProduct(index, i, dir)}
                      />
                    </div>
                  )}

                  {/* Blog content */}
                  {section.section_type === 'blog' && (
                    <BlogPicker
                      items={section.blogs}
                      onAdd={b => addSectionBlog(index, b)}
                      onRemove={bid => removeSectionBlog(index, bid)}
                      onMove={(i, dir) => moveSectionBlog(index, i, dir)}
                    />
                  )}

                  {/* Story / overview content */}
                  {(section.section_type === 'story' || section.section_type === 'overview') && (
                    <div>
                      <label className={labelClass}>
                        {section.section_type === 'overview' ? 'Overview Text' : 'Story Text'} — HTML allowed (headings, lists, images…)
                      </label>
                      <textarea
                        rows={6}
                        className={`${inputClass} resize-y font-mono text-xs`}
                        value={section.content}
                        onChange={e => updateSection(index, { content: e.target.value })}
                        placeholder={section.section_type === 'overview'
                          ? 'Write the overview here…\n\nYou can use <h2>, <p>, <ul><li>, <strong>, <a>, <img> etc.'
                          : 'Write the story here…\n\nYou can use <h2>, <p>, <ul><li>, <strong>, <a>, <img> etc.'}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Plain text works too — line breaks are preserved. HTML is rendered on the page.</p>
                    </div>
                  )}

                  {/* Section background */}
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs font-medium text-slate-600 mb-2">Section Background</p>
                    <BgBuilder
                      bg={{ type: section.bg_type, color: section.bg_color, image: section.bg_image, video: section.bg_video }}
                      onChange={bg => updateSection(index, {
                        bg_type: bg.type,
                        bg_color: bg.color || '',
                        bg_image: bg.image || '',
                        bg_video: bg.video || '',
                      })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add section */}
        <div ref={sectionsEndRef} className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-600 mb-2">Add a new section</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SECTION_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => addSection(t.value)}
                className="group flex flex-col items-start gap-1 p-3 rounded-xl border border-dashed border-slate-300 bg-white text-left hover:border-emerald-400 hover:bg-emerald-50/40 transition-all"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[11px]" style={{ backgroundColor: t.value === 'products' ? '#2D6A4F' : t.value === 'blog' ? '#1D4ED8' : t.value === 'overview' ? '#B45309' : '#7C3AED' }}>+</span>
                  {t.label}
                </span>
                <span className="text-[10px] text-slate-400 leading-snug">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ══ Schedule ══ */}
      <Section title="Countdown & Schedule" desc="The countdown runs until ends_at. Leave both empty for an always-on campaign.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Starts At</label>
            <input type="datetime-local" className={inputClass} value={form.starts_at} onChange={e => updateField('starts_at', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Ends At</label>
            <input type="datetime-local" className={inputClass} value={form.ends_at} onChange={e => updateField('ends_at', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ══ SEO ══ */}
      <Section title="SEO (optional)" desc="Defaults to the campaign name and tagline when left blank.">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelClass}>Meta Title</label>
            <input className={inputClass} value={form.meta_title} onChange={e => updateField('meta_title', e.target.value)} placeholder="e.g. Ganesh Chaturthi Special – Modak Ingredients & Prasad | Konkan Ghar" />
          </div>
          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea rows={2} className={`${inputClass} resize-y`} value={form.meta_description} onChange={e => updateField('meta_description', e.target.value)} placeholder="e.g. Everything you need for Ganesh Chaturthi — modak ingredients, prasad essentials and festive sweets, delivered fresh." />
          </div>
        </div>
      </Section>

      {/* ══ Settings ══ */}
      <Section title="Settings">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <label className={labelClass}>Sort Order</label>
            <input type="number" className={inputClass} value={form.sort_order} onChange={e => updateField('sort_order', e.target.value)} />
          </div>
          <Toggle
            value={!!form.is_active}
            onChange={() => updateField('is_active', form.is_active ? 0 : 1)}
            label={form.is_active ? 'Active' : 'Inactive'}
            desc="Inactive campaigns are hidden from the website."
          />
        </div>
      </Section>

      {/* ══ Actions ══ */}
      <div className="flex items-center gap-3 pt-1">
        <Button size="sm" onClick={handleSave} loading={saving}>
          {isNew ? 'Create Campaign' : 'Save Changes'}
        </Button>
        <button
          onClick={() => router.push('/campaigns')}
          className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        {!isNew && form.slug && (
          <a
            href={getStorefrontUrl(`/campaign/${form.slug}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            View live page
          </a>
        )}
      </div>
      </div>

      {/* ══ Right: live preview ══ */}
      <div className="hidden lg:block lg:sticky lg:top-24">
        <CampaignPreview form={form} sections={sections} />
      </div>
    </div>
  );
}
