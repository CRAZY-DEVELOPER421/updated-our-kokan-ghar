'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', image_url: '', parent_id: '', sort_order: 0, meta_title: '', meta_description: '' });
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.data;
    },
    retry: 1,
  });

  const categories = data?.categories || [];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', image_url: '', parent_id: '', sort_order: 0, meta_title: '', meta_description: '' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image_url: cat.image_url || '',
      parent_id: cat.parent_id || '',
      sort_order: cat.sort_order || 0,
      meta_title: cat.meta_title || '',
      meta_description: cat.meta_description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name is required.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, form);
        toast.success('Category updated!');
      } else {
        await api.post('/admin/categories', form);
        toast.success('Category created!');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save category.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Products in this category will need to be reassigned.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    } catch (err) { toast.error('Failed to delete category.'); }
  };

  const handleToggleActive = async (cat) => {
    try {
      await api.put(`/admin/categories/${cat.id}`, { is_active: cat.is_active ? 0 : 1 });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(cat.is_active ? 'Category deactivated' : 'Category activated');
    } catch (err) { toast.error('Failed to update category.'); }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white";
  const parentCategories = categories.filter(c => !c.parent_id);

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-32 h-8 mb-1" /><Skeleton className="w-20 h-4" /></div>
          <Skeleton className="w-28 h-9 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-2"><Skeleton className="w-28 h-5" /><Skeleton className="w-14 h-4 rounded-full" /></div>
              <Skeleton className="w-full h-3 mb-1" /><Skeleton className="w-3/4 h-3 mb-3" />
              <div className="flex gap-2"><Skeleton className="w-16 h-3" /><Skeleton className="w-16 h-3" /></div>
              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-50"><Skeleton className="w-8 h-3" /><Skeleton className="w-10 h-3" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load categories</span>
            <button onClick={() => refetch()} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">{categories.length} category{categories.length !== 1 ? 'ies' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}>+ Add Category</Button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">No categories yet</span>
            <p className="text-xs text-slate-400">Create your first category to organize products.</p>
            <Button size="sm" onClick={openCreate}>+ Create Category</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="group bg-white rounded-xl border border-slate-100 p-4 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/10 transition-all duration-200">
              {/* Image */}
              {cat.image_url ? (
                <div className="w-full h-28 rounded-lg overflow-hidden mb-3 bg-slate-50">
                  <img src={getImageUrl(cat.image_url)} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="w-full h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">{cat.name}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(cat)} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${cat.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              {/* Description */}
              {cat.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2.5 leading-relaxed">{cat.description}</p>}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  {cat.product_count || 0} products
                </span>
                {cat.parent_name && (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                    {cat.parent_name}
                  </span>
                )}
                <span>Sort: {cat.sort_order || 0}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 mt-3 pt-2.5 border-t border-slate-50">
                <button onClick={() => openEdit(cat)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-all">Edit</button>
                <button onClick={() => handleDelete(cat.id)} className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-all">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl transition-all duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Konkan Mangoes & Fruits" autoFocus />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea className={`${inputClass} resize-none h-16`} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Category description..." />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Image URL</label>
                <input className={inputClass} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
                {form.image_url && (
                  <img src={getImageUrl(form.image_url)} alt="Preview" className="mt-2 w-full h-24 object-cover rounded-lg border border-slate-200" onError={(e) => { e.target.style.display = 'none'; }} />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Parent Category</label>
                <select className={inputClass} value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}>
                  <option value="">None (Top-level)</option>
                  {parentCategories.filter(c => c.id !== editing?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort Order</label>
                <input className={inputClass} type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} placeholder="e.g. 1" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Meta Title</label>
                <input className={inputClass} value={form.meta_title} onChange={e => setForm({...form, meta_title: e.target.value})} placeholder="SEO title..." />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Meta Description</label>
                <textarea className={`${inputClass} resize-none h-16`} value={form.meta_description} onChange={e => setForm({...form, meta_description: e.target.value})} placeholder="SEO description..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
