'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AddressForm({ form, onChange, onSubmit, saving }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Full name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';

    if (!form.phone?.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit phone number';

    if (!form.house_no?.trim()) errs.house_no = 'House / Flat number is required';
    if (!form.street?.trim()) errs.street = 'Street / Area is required';
    if (!form.city?.trim()) errs.city = 'City is required';
    if (!form.state?.trim()) errs.state = 'State is required';

    if (!form.pincode?.trim()) errs.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode.replace(/\D/g, ''))) errs.pincode = 'Pincode must be exactly 6 digits';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Input label="Full Name" value={form.name} onChange={(e) => { onChange({ ...form, name: e.target.value }); if (errors.name) setErrors((prev) => ({ ...prev, name: '' })); }} error={errors.name} />
      <Input label="Phone" type="tel" value={form.phone} onChange={(e) => { onChange({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }); if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' })); }} error={errors.phone} maxLength={10} />
      <Input label="House / Flat No." value={form.house_no} onChange={(e) => { onChange({ ...form, house_no: e.target.value }); if (errors.house_no) setErrors((prev) => ({ ...prev, house_no: '' })); }} error={errors.house_no} />
      <Input label="Street / Area" value={form.street} onChange={(e) => { onChange({ ...form, street: e.target.value }); if (errors.street) setErrors((prev) => ({ ...prev, street: '' })); }} error={errors.street} />
      <Input label="City" value={form.city} onChange={(e) => { onChange({ ...form, city: e.target.value }); if (errors.city) setErrors((prev) => ({ ...prev, city: '' })); }} error={errors.city} />
      <Input label="State" value={form.state} onChange={(e) => { onChange({ ...form, state: e.target.value }); if (errors.state) setErrors((prev) => ({ ...prev, state: '' })); }} error={errors.state} />
      <Input label="Pincode" value={form.pincode} onChange={(e) => { onChange({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }); if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' })); }} error={errors.pincode} maxLength={6} />
      <div className="sm:col-span-2 flex items-center gap-4">
        <select value={form.address_type || 'home'} onChange={(e) => onChange({ ...form, address_type: e.target.value })} className="input-field text-sm flex-1">
          <option value="home">Home</option><option value="work">Work</option><option value="other">Other</option>
        </select>
      </div>
      <div className="sm:col-span-2"><label className="flex items-center gap-2 text-sm text-konkan-text-secondary cursor-pointer">
        <input type="checkbox" checked={form.is_default || false} onChange={(e) => onChange({ ...form, is_default: e.target.checked })} className="rounded" /> Set as default address</label></div>
      <div className="sm:col-span-2"><Button type="submit" size="sm" loading={saving}>Save Address</Button></div>
    </form>
  );
}
