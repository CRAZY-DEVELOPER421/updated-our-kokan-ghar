'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';

const emptyForm = {
  name: '', phone: '', house_no: '', street: '', city: '', state: '', pincode: '', is_default: false, address_type: 'home',
};

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | address id
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get('/users/addresses');
      return res.data.data.addresses;
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setEditing(null);
  };

  const openEdit = (addr) => {
    setForm({
      name: addr.name || '',
      phone: addr.phone || '',
      house_no: addr.house_no || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      is_default: !!addr.is_default,
      address_type: addr.address_type || 'home',
    });
    setErrors({});
    setEditing(addr.id);
  };

  const openNew = () => {
    setForm(emptyForm);
    setErrors({});
    setEditing('new');
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit number';
    if (!form.house_no.trim()) errs.house_no = 'House / Flat number is required';
    if (!form.street.trim()) errs.street = 'Street / Area is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!form.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode.replace(/\D/g, ''))) errs.pincode = 'Pincode must be exactly 6 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = { ...form, is_default: form.is_default ? 1 : 0 };
      let res;
      if (editing === 'new') {
        res = await api.post('/users/addresses', payload);
      } else {
        res = await api.put(`/users/addresses/${editing}`, payload);
      }
      if (res.data.success) {
        toast.success(editing === 'new' ? 'Address added' : 'Address updated');
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/users/addresses/${id}`);
      if (res.data.success) {
        toast.success('Address deleted');
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl card p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-1"><Skeleton variant="title" /><Skeleton variant="text" /><Skeleton variant="text" className="w-1/2" /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-konkan-text-secondary">{addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}</p>
        <Button size="sm" onClick={openNew}>+ Add Address</Button>
      </div>

      {addresses.length === 0 && !editing ? (
        <div className="bg-white rounded-2xl card p-10 text-center">
          <div className="mb-4 flex justify-center">
            <svg className="w-10 h-10 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-1">No addresses saved</h2>
          <p className="text-sm text-konkan-text-secondary mb-4">Add a delivery address to start shopping.</p>
          <Button onClick={openNew}>Add Address</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`bg-white rounded-xl card p-4 ${addr.is_default ? 'ring-2 ring-konkan-green-primary ring-offset-2' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-konkan-text-primary">{addr.name}</span>
                    <span className="px-1.5 py-0.5 bg-konkan-cream rounded text-[10px] text-konkan-text-secondary capitalize">{addr.address_type}</span>
                    {addr.is_default === 1 && <span className="px-1.5 py-0.5 bg-konkan-green-primary/10 rounded text-[10px] text-konkan-green-primary font-medium">Default</span>}
                  </div>
                  <p className="text-sm text-konkan-text-secondary mt-1">{addr.house_no}, {addr.street}</p>
                  <p className="text-sm text-konkan-text-secondary">{addr.city}, {addr.state} — {addr.pincode}</p>
                  <p className="text-xs text-konkan-text-secondary mt-0.5">Phone: {addr.phone}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(addr)} className="p-1.5 rounded-lg text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-cream transition-colors" aria-label="Edit address">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirmId(addr.id)} className="p-1.5 rounded-lg text-konkan-text-secondary hover:text-konkan-error hover:bg-red-50 transition-colors" aria-label="Delete address">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={editing !== null}
        onClose={resetForm}
        title={editing === 'new' ? 'Add New Address' : 'Edit Address'}
        size="md"
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Full Name" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors((prev) => ({ ...prev, name: '' })); }} error={errors.name} />
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }); if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' })); }} error={errors.phone} maxLength={10} />
          <Input label="House / Flat No." value={form.house_no} onChange={(e) => { setForm({ ...form, house_no: e.target.value }); if (errors.house_no) setErrors((prev) => ({ ...prev, house_no: '' })); }} error={errors.house_no} />
          <Input label="Street / Area" value={form.street} onChange={(e) => { setForm({ ...form, street: e.target.value }); if (errors.street) setErrors((prev) => ({ ...prev, street: '' })); }} error={errors.street} />
          <Input label="City" value={form.city} onChange={(e) => { setForm({ ...form, city: e.target.value }); if (errors.city) setErrors((prev) => ({ ...prev, city: '' })); }} error={errors.city} />
          <Input label="State" value={form.state} onChange={(e) => { setForm({ ...form, state: e.target.value }); if (errors.state) setErrors((prev) => ({ ...prev, state: '' })); }} error={errors.state} />
          <Input label="Pincode" value={form.pincode} onChange={(e) => { setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }); if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' })); }} error={errors.pincode} maxLength={6} />
          <div className="flex items-center gap-4">
            <select
              value={form.address_type}
              onChange={(e) => setForm({ ...form, address_type: e.target.value })}
              className="input-field text-sm flex-1"
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-konkan-text-secondary cursor-pointer">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded" />
              Set as default address
            </label>
          </div>
          <div className="sm:col-span-2 flex gap-2 pt-2">
            <Button type="submit" loading={saving}>{editing === 'new' ? 'Add Address' : 'Save Changes'}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="Delete Address" size="sm">
        <p className="text-sm text-konkan-text-secondary mb-4">Are you sure you want to delete this address? This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => handleDelete(deleteConfirmId)}>Delete</Button>
          <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
