'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';

const defaultBundle = {
  name: '', description: '', bundle_price: '', original_price: '',
  valid_from: '', valid_until: '', sort_order: 0, is_active: 1,
};

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-all">
      <h2 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        {title}
      </h2>
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

export default function AdminBundleEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [form, setForm] = useState(defaultBundle);
  const [bundleItems, setBundleItems] = useState([]); // { product_id, quantity, name, price, primary_image }
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const searchRef = useRef(null);

  // Fetch bundle
  const { data: bundleData, isLoading: bundleLoading, isError: bundleError } = useQuery({
    queryKey: ['admin-bundle', id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await api.get(`/admin/bundles/${id}`);
      return res.data.data.bundle;
    },
    enabled: !isNew,
    retry: 1,
  });

  // Populate form
  useEffect(() => {
    if (!bundleData) return;
    setForm({
      name: bundleData.name || '',
      description: bundleData.description || '',
      bundle_price: bundleData.bundle_price ?? '',
      original_price: bundleData.original_price ?? '',
      valid_from: bundleData.valid_from ? bundleData.valid_from.slice(0, 16) : '',
      valid_until: bundleData.valid_until ? bundleData.valid_until.slice(0, 16) : '',
      sort_order: bundleData.sort_order || 0,
      is_active: bundleData.is_active ?? 1,
    });
    setBundleItems((bundleData.products || []).map(p => ({
      product_id: p.product_id,
      quantity: p.quantity,
      name: p.name,
      price: p.price,
      primary_image: p.primary_image,
    })));
  }, [bundleData]);

  // Unsaved changes warning
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Debounced product search for the picker
  useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/admin/products', { params: { search: productSearch, limit: 8 } });
        const list = (res.data.data?.products || []).filter(p => !bundleItems.some(b => b.product_id === p.id));
        setSearchResults(list);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [productSearch, bundleItems]);

  const addBundleItem = (p) => {
    if (bundleItems.some(b => b.product_id === p.id)) return;
    setBundleItems(prev => [...prev, { product_id: p.id, quantity: 1, name: p.name, price: p.price, primary_image: p.image }]);
    setProductSearch('');
    setSearchResults([]);
    setDirty(true);
    searchRef.current?.focus();
  };

  const updateBundleQty = (productId, quantity) => {
    setBundleItems(prev => prev.map(b => b.product_id === productId ? { ...b, quantity: Math.max(1, parseInt(quantity) || 1) } : b));
    setDirty(true);
  };

  const removeBundleItem = (productId) => {
    setBundleItems(prev => prev.filter(b => b.product_id !== productId));
    setDirty(true);
  };

  // ── Validation ──
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Bundle name is required';
    if (!form.bundle_price || parseFloat(form.bundle_price) <= 0) errs.bundle_price = 'Valid bundle price is required';
    if (!form.original_price || parseFloat(form.original_price) <= 0) errs.original_price = 'Valid original price is required';
    if (bundleItems.length === 0) errs.bundle_items = 'Add at least one product to this bundle';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        bundle_price: parseFloat(form.bundle_price),
        original_price: parseFloat(form.original_price),
        is_active: form.is_active ? 1 : 0,
        sort_order: parseInt(form.sort_order) || 0,
        valid_from: form.valid_from ? form.valid_from.replace('T', ' ').slice(0, 19) : null,
        valid_until: form.valid_until ? form.valid_until.replace('T', ' ').slice(0, 19) : null,
        bundle_products: bundleItems.map(b => ({ product_id: b.product_id, quantity: b.quantity })),
      };
      if (isNew) {
        const res = await api.post('/admin/bundles', payload);
        toast.success('Bundle created!');
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
        router.push(`/bundles/${res.data.data.id}`);
      } else {
        await api.put(`/admin/bundles/${id}`, payload);
        toast.success('Bundle updated!');
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
        queryClient.invalidateQueries({ queryKey: ['admin-bundle', id] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bundle.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const linked = bundleData?.linked_product_name ? `\n\nLinked combo product "${bundleData.linked_product_name}" will also be deleted.` : '';
    if (!confirm(`Delete bundle "${form.name}"?${linked}`)) return;
    try {
      await api.delete(`/admin/bundles/${id}`);
      toast.success('Bundle deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
      router.push('/bundles');
    } catch (err) { toast.error('Failed to delete bundle.'); }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white placeholder:text-slate-400";
  const errInputClass = "w-full border border-rose-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all bg-white";
  const labelClass = "block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider";

  if (!isNew && bundleLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-40 h-8 mb-1" /><Skeleton className="w-32 h-4" /></div>
          <div className="flex gap-2"><Skeleton className="w-20 h-9 rounded-lg" /><Skeleton className="w-28 h-9 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-5">
                <Skeleton className="w-28 h-4 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 rounded-lg" /><Skeleton className="h-10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!isNew && bundleError) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Bundle not found</span>
            <Button size="sm" onClick={() => router.push('/bundles')}>Back to Bundles</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm -mx-4 px-4 py-3 -mt-4 mb-0 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{isNew ? 'Add Bundle' : 'Edit Bundle'}</h1>
            {dirty && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Unsaved changes</span>}
          </div>
          {!isNew && bundleData && <p className="text-xs text-slate-500 mt-0.5">ID: {bundleData.id}{bundleData.linked_product_name ? ` • Linked product: ${bundleData.linked_product_name}` : ''}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>}
          <Button variant="ghost" size="sm" onClick={() => { if (!dirty || confirm('Discard unsaved changes?')) router.push('/bundles'); }}>Cancel</Button>
          <Button size="sm" onClick={handleSave} loading={saving}>{isNew ? 'Create Bundle' : 'Save Changes'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── LEFT ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Section title="Bundle Details" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Bundle Name *</label>
                <input className={errors.name ? errInputClass : inputClass} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Mango Lovers Combo" />
                {errors.name && <p className="text-[11px] text-rose-500 mt-0.5">{errors.name}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} resize-none h-20`} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="What's included and why this combo is a great deal..." />
              </div>
              <div>
                <label className={labelClass}>Bundle Price (₹) *</label>
                <input type="number" step="0.01" className={errors.bundle_price ? errInputClass : inputClass} value={form.bundle_price} onChange={e => updateField('bundle_price', e.target.value)} placeholder="e.g. 2349" />
                {errors.bundle_price && <p className="text-[11px] text-rose-500 mt-0.5">{errors.bundle_price}</p>}
              </div>
              <div>
                <label className={labelClass}>Original Price (₹) *</label>
                <input type="number" step="0.01" className={errors.original_price ? errInputClass : inputClass} value={form.original_price} onChange={e => updateField('original_price', e.target.value)} placeholder="e.g. 3747" />
                {errors.original_price && <p className="text-[11px] text-rose-500 mt-0.5">{errors.original_price}</p>}
              </div>
              {form.bundle_price && form.original_price && parseFloat(form.original_price) > parseFloat(form.bundle_price) && (
                <div className="md:col-span-2 flex items-center gap-2 text-xs">
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    {Math.round(((parseFloat(form.original_price) - parseFloat(form.bundle_price)) / parseFloat(form.original_price)) * 100)}% OFF
                  </span>
                  <span className="text-slate-500">Save ₹{Number(parseFloat(form.original_price) - parseFloat(form.bundle_price)).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </Section>

          {/* Products */}
          <Section title="Products in this Bundle" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Add Products *</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input
                    ref={searchRef}
                    className={`${inputClass} pl-9`}
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search products to add to this bundle..."
                  />
                  {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                    {searchResults.map(p => (
                      <button key={p.id} type="button" onClick={() => addBundleItem(p)} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                          {p.image ? (
                            <img src={getImageUrl(p.image)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-500">₹{Number(p.price).toLocaleString('en-IN')}</p>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-600 shrink-0">+ Add</span>
                      </button>
                    ))}
                  </div>
                )}
                {productSearch && !searching && searchResults.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1.5">No matching products found.</p>
                )}
              </div>

              {/* Selected */}
              {bundleItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Selected ({bundleItems.length})</p>
                  {bundleItems.map(item => (
                    <div key={item.product_id} className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500">₹{Number(item.price).toLocaleString('en-IN')} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => updateBundleQty(item.product_id, item.quantity - 1)} className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">−</button>
                        <span className="w-8 text-center text-xs font-semibold text-slate-900 tabular-nums">{item.quantity}</span>
                        <button type="button" onClick={() => updateBundleQty(item.product_id, item.quantity + 1)} className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">+</button>
                      </div>
                      <button type="button" onClick={() => removeBundleItem(item.product_id)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Remove">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.bundle_items && <p className="text-[11px] text-rose-500 mt-0.5">{errors.bundle_items}</p>}
            </div>
          </Section>
        </div>

        {/* ─── RIGHT ─────────────────────────────── */}
        <div className="space-y-6">
          {/* Status */}
          <Section title="Status & Validity" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <div className="space-y-3">
              <Toggle value={form.is_active} onChange={() => updateField('is_active', form.is_active ? 0 : 1)} label="Active" desc="Show this bundle on the storefront" />
              <div>
                <label className={labelClass}>Valid From</label>
                <input type="datetime-local" className={inputClass} value={form.valid_from} onChange={e => updateField('valid_from', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Valid Until</label>
                <input type="datetime-local" className={inputClass} value={form.valid_until} onChange={e => updateField('valid_until', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Sort Order</label>
                <input type="number" className={inputClass} value={form.sort_order} onChange={e => updateField('sort_order', e.target.value)} placeholder="e.g. 1" />
              </div>
            </div>
          </Section>

          {/* Preview card */}
          {form.name && bundleItems.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h2 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <span className="text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></span>
                Live Preview
              </h2>
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <div className="bg-gradient-to-br from-emerald-700 to-[#1B4332] p-4 text-white">
                  <p className="text-[9px] uppercase tracking-widest text-emerald-200/80 font-semibold">Bundle Deal</p>
                  <p className="text-sm font-bold mt-0.5 leading-snug">{form.name}</p>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-lg font-bold">₹{Number(form.bundle_price || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[11px] text-emerald-200/70 line-through">₹{Number(form.original_price || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {form.bundle_price && form.original_price && parseFloat(form.original_price) > parseFloat(form.bundle_price) && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                      {Math.round(((parseFloat(form.original_price) - parseFloat(form.bundle_price)) / parseFloat(form.original_price)) * 100)}% OFF
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1.5 bg-slate-50">
                  {bundleItems.map(item => (
                    <div key={item.product_id} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="w-4 text-center text-slate-400 font-bold">{item.quantity}×</span>
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
