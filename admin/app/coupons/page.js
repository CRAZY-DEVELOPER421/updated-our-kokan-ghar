'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

const defaultCoupon = { code: '', type: 'percentage', value: '', min_order_amount: 0, max_discount: '', usage_limit: '', is_active: 1, valid_from: '', valid_until: '', description: '' };

const COUPON_TYPE_CONFIG = {
  percentage: { label: '% OFF', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: '%' },
  flat: { label: '₹ OFF', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '₹' },
  free_shipping: { label: 'Free Shipping', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🚚' },
  bogo: { label: 'BOGO', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🎁' },
};

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function UsageBar({ used, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
        <span>Usage</span>
        <span>{used}/{total || '∞'}</span>
      </div>
      {total > 0 && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 90 ? '#f43f5e' : pct >= 70 ? '#f59e0b' : '#10b981' }} />
        </div>
      )}
    </div>
  );
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultCoupon);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const res = await api.get('/admin/coupons');
      return res.data.data;
    },
    retry: 1,
  });

  const coupons = data?.coupons || [];

  const openCreate = () => { setEditing(null); setForm(defaultCoupon); setShowModal(true); };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code || '', type: coupon.type || 'percentage', value: coupon.value || '',
      min_order_amount: coupon.min_order_amount || 0, max_discount: coupon.max_discount || '',
      usage_limit: coupon.usage_limit || '', is_active: coupon.is_active ?? 1,
      valid_from: coupon.valid_from ? coupon.valid_from.slice(0, 16) : '',
      valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 16) : '',
      description: coupon.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.value) { toast.error('Code and value are required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, value: parseFloat(form.value), min_order_amount: parseFloat(form.min_order_amount) || 0, max_discount: form.max_discount ? parseFloat(form.max_discount) : null, usage_limit: form.usage_limit ? parseInt(form.usage_limit) : 0 };
      if (editing) {
        await api.put(`/admin/coupons/${editing.id}`, payload);
        toast.success('Coupon updated!');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created!');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save coupon.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try { await api.delete(`/admin/coupons/${id}`); toast.success('Coupon deleted.'); queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); }
    catch (err) { toast.error('Failed to delete coupon.'); }
  };

  const handleToggle = async (coupon) => {
    try { await api.put(`/admin/coupons/${coupon.id}`, { is_active: coupon.is_active ? 0 : 1 }); queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); }
    catch (err) { toast.error('Failed to update coupon.'); }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white";

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-28 h-8 mb-1" /><Skeleton className="w-20 h-4" /></div>
          <Skeleton className="w-28 h-9 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-2"><Skeleton className="w-24 h-6" /><Skeleton className="w-9 h-5 rounded-full" /></div>
              <Skeleton className="w-20 h-6 mb-1" /><Skeleton className="w-28 h-3 mb-1" /><Skeleton className="w-24 h-3" />
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
        <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load coupons</span>
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
          <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
          <p className="text-sm text-slate-500 mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}>+ Add Coupon</Button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">No coupons yet</span>
            <p className="text-xs text-slate-400">Create your first coupon to offer discounts to customers.</p>
            <Button size="sm" onClick={openCreate}>+ Create Coupon</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const typeConfig = COUPON_TYPE_CONFIG[c.type] || COUPON_TYPE_CONFIG.percentage;
            const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
            return (
              <div key={c.id} className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/10 transition-all duration-200">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-emerald-700 tracking-tight">{c.code}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${typeConfig.color}`}>{typeConfig.icon} {typeConfig.label}</span>
                    </div>
                    <button onClick={() => handleToggle(c)} className={`relative w-10 h-5 rounded-full transition-colors ${c.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${c.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {/* Value */}
                  <p className="text-xl font-bold text-slate-900">
                    {c.type === 'percentage' ? `${c.value}% OFF` : c.type === 'flat' ? `₹${Number(c.value).toLocaleString('en-IN')} OFF` : c.type === 'free_shipping' ? 'Free Shipping' : 'BOGO Offer'}
                  </p>

                  {/* Conditions */}
                  <div className="mt-2 space-y-1">
                    {c.min_order_amount > 0 && <p className="text-[11px] text-slate-500">Min order: <span className="font-semibold text-slate-700">₹{Number(c.min_order_amount).toLocaleString('en-IN')}</span></p>}
                    {c.max_discount && <p className="text-[11px] text-slate-500">Max discount: <span className="font-semibold text-slate-700">₹{Number(c.max_discount).toLocaleString('en-IN')}</span></p>}
                  </div>

                  {/* Usage Bar */}
                  <UsageBar used={c.used_count || 0} total={c.usage_limit} />

                  {/* Validity */}
                  <div className="mt-2 flex items-center justify-between">
                    {c.valid_from && c.valid_until ? (
                      <p className="text-[10px] text-slate-400">
                        {new Date(c.valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(c.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    ) : <span />}
                    {isExpired && <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Expired</span>}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-50 px-4 py-2 flex items-center justify-end gap-2 bg-slate-50/30">
                  <button onClick={() => openEdit(c)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-all">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-all">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Coupon Code *</label>
                <input className={inputClass} value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g. SUMMER20" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
                <select className={inputClass} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Value *</label>
                <input className={inputClass} type="number" step="0.01" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 100'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Min Order Amount</label>
                <input className={inputClass} type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} placeholder="e.g. 499" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Max Discount</label>
                <input className={inputClass} type="number" value={form.max_discount} onChange={e => setForm({...form, max_discount: e.target.value})} placeholder="e.g. 200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Usage Limit</label>
                <input className={inputClass} type="number" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: e.target.value})} placeholder="e.g. 1000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valid From</label>
                <input className={inputClass} type="datetime-local" value={form.valid_from} onChange={e => setForm({...form, valid_from: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valid Until *</label>
                <input className={inputClass} type="datetime-local" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea className={`${inputClass} resize-none h-16`} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Coupon description..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} loading={saving}>{editing ? 'Update Coupon' : 'Create Coupon'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
