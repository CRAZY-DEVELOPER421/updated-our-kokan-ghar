'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

const VIDEO_CATEGORIES = [
  { id: 1, name: 'Reels', type: 'reels' },
  { id: 2, name: 'Shorts', type: 'shorts' },
  { id: 3, name: 'Long Videos', type: 'long' },
  { id: 4, name: 'Customer Stories', type: 'customer_story' },
  { id: 5, name: 'Product Videos', type: 'product' },
];

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function formatDuration(sec) {
  if (!sec || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminVideosPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [errors, setErrors] = useState({});
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const emptyForm = {
    title: '', video_url: '', thumbnail_url: '', description: '',
    category_id: '', duration_seconds: 0, tags: '',
    is_published: 1, is_featured: 0,
    og_image: '', meta_title: '', meta_description: '',
    scheduled_at: '',
  };

  const [form, setForm] = useState({ ...emptyForm });

  // ── Search & Filter State ────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Build query params for search/filter
  const queryString = useMemo(() => {
    const p = new URLSearchParams({ all: 'true', limit: '100' });
    if (searchTerm) p.set('search', searchTerm);
    if (categoryFilter) p.set('category', categoryFilter);
    return p.toString();
  }, [searchTerm, categoryFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-videos', queryString],
    queryFn: async () => {
      const res = await api.get(`/cms/videos?${queryString}`);
      return res.data.data;
    },
  });

  const videos = data?.videos || [];

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      title: v.title || '',
      video_url: v.video_url || '',
      thumbnail_url: v.thumbnail_url || '',
      description: v.description || '',
      category_id: v.category_id || '',
      duration_seconds: v.duration_seconds || 0,
      tags: v.tags || '',
      is_published: v.is_published ?? 1,
      is_featured: v.is_featured ?? 0,
      og_image: v.og_image || '',
      meta_title: v.meta_title || '',
      meta_description: v.meta_description || '',
      scheduled_at: v.scheduled_at ? v.scheduled_at.slice(0, 16) : '',
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.category_id) errs.category_id = 'Category is required';
    if (!form.video_url && !editing?.video_url) {
      errs.video_url = 'Video URL or file is required';
    }
    // Allow empty video_url for existing videos (keep old one)
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the validation errors.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_seconds: parseInt(form.duration_seconds) || 0,
        is_published: form.is_published ? 1 : 0,
        is_featured: form.is_featured ? 1 : 0,
      };

      if (editing) {
        await api.put(`/cms/videos/${editing.id}`, payload);
        toast.success('Video updated successfully!');
      } else {
        await api.post('/cms/videos', payload);
        toast.success('Video created successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save video.');
    }
    setSaving(false);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/cms/videos/${id}`);
      toast.success('Video deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
    } catch (err) {
      toast.error('Failed to delete.');
    }
  };

  const handleTogglePublish = async (v) => {
    try {
      await api.put(`/cms/videos/${v.id}`, { is_published: v.is_published ? 0 : 1 });
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      toast.success(v.is_published ? 'Video unpublished' : 'Video published');
    } catch (err) {
      toast.error('Failed to update.');
    }
  };

  // ── Video File Upload ──────────────────────────────────
  const handleVideoUpload = async (file) => {
    if (!file) return;
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error('Only mp4, webm, mov files are allowed.');
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error('File size must be under 200MB.');
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(pct);
        },
      });

      const url = res.data.data?.url || res.data.url;
      if (url) {
        updateField('video_url', url);
        toast.success('Video uploaded!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload video.');
    }
    setUploadingVideo(false);
    setUploadProgress(0);
  };

  // ── Thumbnail Image Upload ─────────────────────────────
  const handleThumbnailUpload = async (file) => {
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data?.url || res.data.url;
      if (url) {
        updateField('thumbnail_url', url);
        toast.success('Thumbnail uploaded!');
      }
    } catch (err) {
      toast.error('Failed to upload thumbnail.');
    }
    setUploadingThumbnail(false);
  };

  // ── Sorting ────────────────────────────────────────────
  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' });

  const sorted = useMemo(() => {
    const arr = [...videos];
    const { key, dir } = sort;
    const d = dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let aV = a[key], bV = b[key];
      if (key === 'title' || key === 'category_name') {
        aV = (aV || '').toLowerCase();
        bV = (bV || '').toLowerCase();
        return aV.localeCompare(bV) * d;
      }
      if (key === 'duration_seconds') return ((aV || 0) - (bV || 0)) * d;
      return (new Date(aV || 0).getTime() - new Date(bV || 0).getTime()) * d;
    });
    return arr;
  }, [videos, sort]);

  const toggleSort = (key) => {
    setSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  function SortIcon({ activeKey, sortKey, dir }) {
    const active = activeKey === sortKey;
    return (
      <span className="inline-flex flex-col items-center ml-1 -mr-0.5">
        <svg className={`w-2 h-2 -mb-0.5 ${active && dir === 'asc' ? 'text-green-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 10 6"><path d="M5 0L10 6H0z" /></svg>
        <svg className={`w-2 h-2 ${active && dir === 'desc' ? 'text-green-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 10 6"><path d="M5 6L0 0h10z" /></svg>
      </span>
    );
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/20 focus:border-konkan-green-primary transition-all";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className=" text-2xl font-bold text-gray-900">Video CMS</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {sorted.length} video{sorted.length !== 1 ? 's' : ''}
            {(searchTerm || categoryFilter) && <span className="text-gray-400 ml-1">(filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search videos..."
              className="w-48 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/20 focus:border-konkan-green-primary transition-all"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/20 focus:border-konkan-green-primary"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {VIDEO_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <Button size="sm" onClick={openCreate}>+ Add Video</Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-konkan-green-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading videos...</span>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500">
            {(searchTerm || categoryFilter)
              ? 'No videos match your search or filters.'
              : 'No videos yet. Click "+ Add Video" to create one.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs w-[32%]">Video</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort('category_name')}>
                    <span className="inline-flex items-center">Category<SortIcon activeKey={sort.key} sortKey="category_name" dir={sort.dir} /></span>
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort('duration_seconds')}>
                    <span className="inline-flex items-center">Duration<SortIcon activeKey={sort.key} sortKey="duration_seconds" dir={sort.dir} /></span>
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort('created_at')}>
                    <span className="inline-flex items-center">Created<SortIcon activeKey={sort.key} sortKey="created_at" dir={sort.dir} /></span>
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                          {v.thumbnail_url ? (
                            <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 text-sm block truncate max-w-[300px]">{v.title}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            {v.view_count || 0} views
                            {v.id && <span className="ml-2">ID: {v.id}</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                        {v.category_name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 tabular-nums">{formatDuration(v.duration_seconds)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${v.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {v.is_published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(v.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleTogglePublish(v)} className="text-[11px] text-konkan-green-primary font-medium hover:underline">{v.is_published ? 'Unpublish' : 'Publish'}</button>
                        <button onClick={() => openEdit(v)} className="text-[11px] text-konkan-green-primary font-medium hover:underline">Edit</button>
                        <button onClick={() => handleDelete(v.id, v.title)} className="text-[11px] text-red-500 font-medium hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-xl my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className=" text-lg font-bold text-gray-900">{editing ? 'Edit Video' : 'Add New Video'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Title */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input className={`${inputClass} ${errors.title ? 'border-red-400 ring-2 ring-red-200' : ''}`} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Enter video title" />
                {errors.title && <p className="text-[11px] text-red-500 mt-0.5">{errors.title}</p>}
              </div>

              {/* Video URL / Upload */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Video URL or Upload *</label>
                <div className="flex gap-2">
                  <input className={`${inputClass} flex-1 ${errors.video_url ? 'border-red-400 ring-2 ring-red-200' : ''}`} value={form.video_url} onChange={e => updateField('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=... or paste uploaded URL" />
                  <input type="file" ref={videoInputRef} accept=".mp4,.webm,.mov" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) handleVideoUpload(f); e.target.value = ''; }} />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="shrink-0 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {uploadingVideo ? `${uploadProgress}%` : 'Choose File'}
                  </button>
                </div>
                {errors.video_url && <p className="text-[11px] text-red-500 mt-0.5">{errors.video_url}</p>}
                {uploadingVideo && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-konkan-green-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                {form.video_url && !uploadingVideo && (
                  <p className="text-[10px] text-green-600 mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    Video source configured
                  </p>
                )}
              </div>

              {/* Thumbnail */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Thumbnail Image</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input className={inputClass} value={form.thumbnail_url} onChange={e => updateField('thumbnail_url', e.target.value)} placeholder="https://... or upload" />
                  </div>
                  <input type="file" ref={thumbnailInputRef} accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) handleThumbnailUpload(f); e.target.value = ''; }} />
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                    className="shrink-0 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {uploadingThumbnail ? 'Uploading...' : 'Browse'}
                  </button>
                </div>
                {form.thumbnail_url && (
                  <img src={form.thumbnail_url} alt="Thumbnail preview" className="mt-2 w-24 h-14 object-cover rounded-lg border border-gray-200" />
                )}
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea className={`${inputClass} resize-none h-16`} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Video description..." />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select className={`${inputClass} ${errors.category_id ? 'border-red-400 ring-2 ring-red-200' : ''}`} value={form.category_id} onChange={e => updateField('category_id', e.target.value)}>
                  <option value="">Select category...</option>
                  {VIDEO_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
                {errors.category_id && <p className="text-[11px] text-red-500 mt-0.5">{errors.category_id}</p>}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Duration (seconds)</label>
                <input className={inputClass} type="number" min="0" value={form.duration_seconds} onChange={e => updateField('duration_seconds', e.target.value)} placeholder="e.g. 120" />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                <input className={inputClass} value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder="tag1, tag2, tag3" />
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Schedule Publish</label>
                <input className={inputClass} type="datetime-local" value={form.scheduled_at} onChange={e => updateField('scheduled_at', e.target.value)} />
              </div>

              {/* OG Image */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">OG Image URL</label>
                <input className={inputClass} value={form.og_image} onChange={e => updateField('og_image', e.target.value)} placeholder="https://..." />
              </div>

              {/* Meta Title */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                <input className={inputClass} value={form.meta_title} onChange={e => updateField('meta_title', e.target.value)} placeholder="SEO title" />
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                <textarea className={`${inputClass} resize-none h-14`} value={form.meta_description} onChange={e => updateField('meta_description', e.target.value)} placeholder="SEO description" />
              </div>

              {/* Toggles */}
              <div className="col-span-2 flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={!!form.is_published} onChange={e => updateField('is_published', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-gray-300 text-konkan-green-primary focus:ring-konkan-green-primary" />
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={!!form.is_featured} onChange={e => updateField('is_featured', e.target.checked ? 1 : 0)} className="w-4 h-4 rounded border-gray-300 text-konkan-green-primary focus:ring-konkan-green-primary" />
                  Featured
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} loading={saving}>{editing ? 'Update Video' : 'Create Video'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
