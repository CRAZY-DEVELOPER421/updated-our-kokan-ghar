'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

const defaultFlashSale = {
  product_id: '', sale_price: '', original_price: '', quantity_limit: '', starts_at: '', ends_at: '',
};

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function getSaleStatus(fs) {
  const now = new Date();
  const start = fs.starts_at ? new Date(fs.starts_at) : null;
  const end = fs.ends_at ? new Date(fs.ends_at) : null;
  if (!fs.is_active) return { label: 'Inactive', color: 'bg-slate-100 text-slate-500' };
  if (end && now > end) return { label: 'Ended', color: 'bg-slate-100 text-slate-500' };
  if (start && now < start) return { label: 'Upcoming', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Live', color: 'bg-emerald-50 text-emerald-700' };
}

export default function AdminFlashSalesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultFlashSale);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-flash-sales'],
    queryFn: async () => {
      const res = await api.get('/admin/flash-sales');
      return res.data.data;
    },
    retry: 1,
  });

  const flashSales = data?.flashSales || [];

  // Fetch products for the picker whenever the modal opens
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      // Fetch the full catalog so every product is pickable (not just the newest 200)
      const res = await api.get(`/admin/products?limit=5000${productSearch ? `&search=${encodeURIComponent(productSearch)}` : ''}`);
      setProducts(res.data.data?.products || []);
    } catch (err) {
      toast.error('Failed to load products.');
    }
    setLoadingProducts(false);
  };

  useEffect(() => {
    if (showModal) loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  // Debounce product search inside the picker
  useEffect(() => {
    if (!showModal) return;
    const t = setTimeout(() => loadProducts(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSearch]);

  const openCreate = () => { setEditing(null); setForm(defaultFlashSale); setProductSearch(''); setShowModal(true); };

  const openEdit = (fs) => {
    setEditing(fs);
    setForm({
      product_id: fs.product_id || '', sale_price: fs.sale_price || '',
      original_price: fs.original_price || '', quantity_limit: fs.quantity_limit || '',
      starts_at: fs.starts_at ? fs.starts_at.slice(0, 16) : '',
      ends_at: fs.ends_at ? fs.ends_at.slice(0, 16) : '',
    });
    setProductSearch('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.product_id || !form.sale_price || !form.original_price || !form.starts_at || !form.ends_at) {
      toast.error('Product, prices, and sale window are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        product_id: parseInt(form.product_id),
        sale_price: parseFloat(form.sale_price),
        original_price: parseFloat(form.original_price),
        quantity_limit: parseInt(form.quantity_limit) || 0,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
      };
      if (editing) {
        await api.put(`/admin/flash-sales/${editing.id}`, payload);
        toast.success('Flash sale updated!');
      } else {
        await api.post('/admin/flash-sales', payload);
        toast.success('Flash sale created!');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] });
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save flash sale.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this flash sale?')) return;
    try { await api.delete(`/admin/flash-sales/${id}`); toast.success('Flash sale deleted.'); queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] }); }
    catch (err) { toast.error('Failed to delete flash sale.'); }
  };

  const handleToggle = async (fs) => {
    try { await api.put(`/admin/flash-sales/${fs.id}`, { is_active: fs.is_active ? 0 : 1 }); queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] }); }
    catch (err) { toast.error('Failed to update flash sale.'); }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white";

  // Fall back to the flash sale's own product info (from the JOIN) when the
  // picked product isn't in the currently fetched products list
  const selectedProduct = products.find(p => String(p.id) === String(form.product_id))
    || (editing ? { id: editing.product_id, name: editing.product_name, image: editing.product_image } : null);

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-32 h-8 mb-1" /><Skeleton className="w-24 h-4" /></div>
          <Skeleton className="w-28 h-9 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1"><Skeleton className="w-48 h-4 mb-1" /><Skeleton className="w-32 h-3" /></div>
              <Skeleton className="w-24 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Flash Sales</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load flash sales</span>
            <button onClick={() => refetch()} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flash Sales</h1>
          <p className="text-sm text-slate-500 mt-0.5">{flashSales.length} flash sale{flashSales.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}>+ Add Flash Sale</Button>
      </div>

      {flashSales.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">No flash sales yet</span>
            <p className="text-xs text-slate-400">Create a timed discount on a product to drive urgency on the Offers page.</p>
            <Button size="sm" onClick={openCreate}>+ Create Flash Sale</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {flashSales.map((fs) => {
            const status = getSaleStatus(fs);
            const discountPct = fs.original_price > 0 ? Math.round(((fs.original_price - fs.sale_price) / fs.original_price) * 100) : 0;
            return (
              <div key={fs.id} className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/10 transition-all duration-200">
                <div className="p-4 flex items-center gap-4">
                  {/* Product thumb */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 flex items-center justify-center">
                    {fs.product_image ? (
                      <img src={fs.product_image} alt={fs.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm truncate max-w-[280px]">{fs.product_name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">₹{Number(fs.sale_price).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400 line-through">₹{Number(fs.original_price).toLocaleString('en-IN')}</span>
                      {discountPct > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{discountPct}% OFF</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(fs.starts_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} → {new Date(fs.ends_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {fs.quantity_limit > 0 && <> · {fs.sold_count || 0}/{fs.quantity_limit} sold</>}
                    </p>
                  </div>

                  {/* Toggle */}
                  <button onClick={() => handleToggle(fs)} className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${fs.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`} aria-label={fs.is_active ? 'Deactivate flash sale' : 'Activate flash sale'}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${fs.is_active ? 'translate-x-5' : ''}`} />
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(fs)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-all">Edit</button>
                    <button onClick={() => handleDelete(fs.id)} className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-all">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Flash Sale' : 'Add Flash Sale'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Product picker */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product *</label>
              {selectedProduct && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                    {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" /> : <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{selectedProduct.name}</p>
                    <p className="text-[10px] text-slate-400">₹{Number(selectedProduct.price).toLocaleString('en-IN')} · {selectedProduct.sku}</p>
                  </div>
                  <button onClick={() => setForm({ ...form, product_id: '' })} className="text-xs text-slate-400 hover:text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-md transition-all">Change</button>
                </div>
              )}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input
                  className={`${inputClass} pl-9`}
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  disabled={!!selectedProduct}
                />
              </div>
              {!selectedProduct && (
                <div className="mt-2 border border-slate-200 rounded-lg max-h-44 overflow-y-auto">
                  {loadingProducts ? (
                    <div className="p-3 space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  ) : products.length === 0 ? (
                    <p className="p-3 text-xs text-slate-400 text-center">No products found</p>
                  ) : (
                    products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setForm({ ...form, product_id: p.id }); setProductSearch(''); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-emerald-50/60 transition-colors ${String(p.id) === String(form.product_id) ? 'bg-emerald-50' : ''}`}
                      >
                        <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
                          {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        </div>
                        <span className="text-xs text-slate-700 truncate flex-1">{p.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">₹{Number(p.price).toLocaleString('en-IN')}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sale Price *</label>
                <input className={inputClass} type="number" step="0.01" value={form.sale_price} onChange={e => setForm({...form, sale_price: e.target.value})} placeholder="e.g. 1599" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Original Price *</label>
                <input className={inputClass} type="number" step="0.01" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} placeholder="e.g. 2499" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Quantity Limit</label>
                <input className={inputClass} type="number" value={form.quantity_limit} onChange={e => setForm({...form, quantity_limit: e.target.value})} placeholder="e.g. 50" />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Starts At *</label>
                  <input className={inputClass} type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ends At *</label>
                  <input className={inputClass} type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} loading={saving}>{editing ? 'Update Flash Sale' : 'Create Flash Sale'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
