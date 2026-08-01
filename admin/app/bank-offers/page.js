'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

const defaultBankOffer = {
  bank_name: '', bank_code: '', logo_url: '', offer_title: '', offer_description: '',
  discount_type: 'credit_card', min_order_amount: 0, max_discount: '',
  is_active: 1, valid_from: '', valid_until: '', terms_url: '', sort_order: 0,
};

const DISCOUNT_TYPE_CONFIG = {
  credit_card: { label: 'Credit Card', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '💳' },
  debit_card: { label: 'Debit Card', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '🏦' },
  upi: { label: 'UPI', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '📱' },
  emi: { label: 'EMI', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '📆' },
  netbanking: { label: 'Net Banking', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: '🖥️' },
};

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function AdminBankOffersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultBankOffer);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-bank-offers'],
    queryFn: async () => {
      const res = await api.get('/admin/bank-offers');
      return res.data.data;
    },
    retry: 1,
  });

  const bankOffers = data?.bankOffers || [];

  const openCreate = () => { setEditing(null); setForm(defaultBankOffer); setShowModal(true); };

  const openEdit = (offer) => {
    setEditing(offer);
    setForm({
      bank_name: offer.bank_name || '', bank_code: offer.bank_code || '', logo_url: offer.logo_url || '',
      offer_title: offer.offer_title || '', offer_description: offer.offer_description || '',
      discount_type: offer.discount_type || 'credit_card', min_order_amount: offer.min_order_amount || 0,
      max_discount: offer.max_discount || '', is_active: offer.is_active ?? 1,
      valid_from: offer.valid_from ? offer.valid_from.slice(0, 16) : '',
      valid_until: offer.valid_until ? offer.valid_until.slice(0, 16) : '',
      terms_url: offer.terms_url || '', sort_order: offer.sort_order || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.bank_name.trim() || !form.offer_title.trim()) { toast.error('Bank name and offer title are required.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active ? 1 : 0,
      };
      if (editing) {
        await api.put(`/admin/bank-offers/${editing.id}`, payload);
        toast.success('Bank offer updated!');
      } else {
        await api.post('/admin/bank-offers', payload);
        toast.success('Bank offer created!');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-bank-offers'] });
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save bank offer.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this bank offer?')) return;
    try { await api.delete(`/admin/bank-offers/${id}`); toast.success('Bank offer deleted.'); queryClient.invalidateQueries({ queryKey: ['admin-bank-offers'] }); }
    catch (err) { toast.error('Failed to delete bank offer.'); }
  };

  const handleToggle = async (offer) => {
    try { await api.put(`/admin/bank-offers/${offer.id}`, { is_active: offer.is_active ? 0 : 1 }); queryClient.invalidateQueries({ queryKey: ['admin-bank-offers'] }); }
    catch (err) { toast.error('Failed to update bank offer.'); }
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
        <h1 className="text-2xl font-bold text-slate-900">Bank Offers</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load bank offers</span>
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
          <h1 className="text-2xl font-bold text-slate-900">Bank Offers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{bankOffers.length} offer{bankOffers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}>+ Add Bank Offer</Button>
      </div>

      {bankOffers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">No bank offers yet</span>
            <p className="text-xs text-slate-400">Add a bank partnership offer to show on the Offers page.</p>
            <Button size="sm" onClick={openCreate}>+ Create Bank Offer</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankOffers.map((o) => {
            const typeConfig = DISCOUNT_TYPE_CONFIG[o.discount_type] || DISCOUNT_TYPE_CONFIG.credit_card;
            const isExpired = o.valid_until && new Date(o.valid_until) < new Date();
            return (
              <div key={o.id} className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/10 transition-all duration-200">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {o.logo_url ? (
                        <img src={o.logo_url} alt={o.bank_name} className="w-8 h-8 rounded-lg object-contain border border-slate-100 bg-white" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">{(o.bank_code || o.bank_name || '?').slice(0, 4)}</div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{o.bank_name}</p>
                        {o.bank_code && <p className="text-[10px] text-slate-400 font-mono">{o.bank_code}</p>}
                      </div>
                    </div>
                    <button onClick={() => handleToggle(o)} className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${o.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`} aria-label={o.is_active ? 'Deactivate offer' : 'Activate offer'}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${o.is_active ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {/* Offer */}
                  <p className="text-lg font-bold text-slate-900 leading-tight">{o.offer_title}</p>
                  {o.offer_description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{o.offer_description}</p>}

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${typeConfig.color}`}>{typeConfig.icon} {typeConfig.label}</span>
                    {Number(o.min_order_amount) > 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-50 text-slate-600 border border-slate-100">Min ₹{Number(o.min_order_amount).toLocaleString('en-IN')}</span>}
                    {o.max_discount && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Save ₹{Number(o.max_discount).toLocaleString('en-IN')}</span>}
                  </div>

                  {/* Validity */}
                  <div className="mt-2 flex items-center justify-between">
                    {o.valid_from && o.valid_until ? (
                      <p className="text-[10px] text-slate-400">
                        {new Date(o.valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(o.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    ) : <span className="text-[10px] text-slate-400">No expiry</span>}
                    {isExpired && <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Expired</span>}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-50 px-4 py-2 flex items-center justify-end gap-2 bg-slate-50/30">
                  <button onClick={() => openEdit(o)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-all">Edit</button>
                  <button onClick={() => handleDelete(o.id)} className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-all">Delete</button>
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
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Bank Offer' : 'Add Bank Offer'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Bank Name *</label>
                <input className={inputClass} value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} placeholder="e.g. HDFC Bank" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bank Code</label>
                <input className={inputClass} value={form.bank_code} onChange={e => setForm({...form, bank_code: e.target.value.toUpperCase()})} placeholder="e.g. HDFC" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Logo URL</label>
                <input className={inputClass} value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Offer Title *</label>
                <input className={inputClass} value={form.offer_title} onChange={e => setForm({...form, offer_title: e.target.value})} placeholder="e.g. Up to ₹150 OFF on credit cards" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Offer Description</label>
                <textarea className={`${inputClass} resize-none h-16`} value={form.offer_description} onChange={e => setForm({...form, offer_description: e.target.value})} placeholder="Offer description..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Discount Type</label>
                <select className={inputClass} value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="emi">EMI</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Min Order Amount</label>
                <input className={inputClass} type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} placeholder="e.g. 999" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Max Discount</label>
                <input className={inputClass} type="number" value={form.max_discount} onChange={e => setForm({...form, max_discount: e.target.value})} placeholder="e.g. 150" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort Order</label>
                <input className={inputClass} type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valid From</label>
                <input className={inputClass} type="datetime-local" value={form.valid_from} onChange={e => setForm({...form, valid_from: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valid Until</label>
                <input className={inputClass} type="datetime-local" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Terms URL</label>
                <input className={inputClass} value={form.terms_url} onChange={e => setForm({...form, terms_url: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} loading={saving}>{editing ? 'Update Bank Offer' : 'Create Bank Offer'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
