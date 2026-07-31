'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function AdminTeamPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', designation: '', short_bio: '', biography: '', email: '', phone: '', image_url: '', instagram: '', facebook: '', linkedin: '', youtube: '', twitter: '', experience_years: 0, skills: '', specialization: '', achievements: '', certifications: '', joining_date: '', is_active: 1, is_featured: 0, display_order: 0 });
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const imageInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: async () => { const res = await api.get('/cms/team'); return res.data.data; },
  });

  const members = data?.members || [];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', designation: '', short_bio: '', biography: '', email: '', phone: '', image_url: '', instagram: '', facebook: '', linkedin: '', youtube: '', twitter: '', experience_years: 0, skills: '', specialization: '', achievements: '', certifications: '', joining_date: '', is_active: 1, is_featured: 0, display_order: members.length });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name || '', designation: m.designation || '', short_bio: m.short_bio || '', biography: m.biography || '',
      email: m.email || '', phone: m.phone || '', image_url: m.image_url || '',
      instagram: m.instagram || '', facebook: m.facebook || '', linkedin: m.linkedin || '', youtube: m.youtube || '', twitter: m.twitter || '',
      experience_years: m.experience_years || 0, skills: m.skills || '', specialization: m.specialization || '',
      achievements: m.achievements || '', certifications: m.certifications || '', joining_date: m.joining_date ? m.joining_date.split('T')[0] : '',
      is_active: m.is_active !== undefined ? m.is_active : 1, is_featured: m.is_featured || 0, display_order: m.display_order || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/cms/team/${editing.id}`, form);
        toast.success('Member updated!');
      } else {
        await api.post('/cms/team', form);
        toast.success('Member created!');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this team member?')) return;
    try { await api.delete(`/cms/team/${id}`); toast.success('Deleted.'); queryClient.invalidateQueries({ queryKey: ['admin-team'] }); }
    catch (err) { toast.error('Failed to delete.'); }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const imageUrl = uploadRes.data.data?.url || uploadRes.data.url;
      if (!imageUrl) { toast.error('Failed to get image URL from upload.'); setImageUploading(false); return; }
      setForm(prev => ({ ...prev, image_url: imageUrl }));
      toast.success('Image uploaded!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to upload image.'); }
    setImageUploading(false);
  };

  const toggleFeatured = async (id, val) => {
    try { await api.put(`/cms/team/${id}`, { is_featured: val ? 1 : 0 }); queryClient.invalidateQueries({ queryKey: ['admin-team'] }); }
    catch (err) { toast.error('Failed to update.'); }
  };

  const toggleActive = async (id, val) => {
    try { await api.put(`/cms/team/${id}`, { is_active: val ? 1 : 0 }); queryClient.invalidateQueries({ queryKey: ['admin-team'] }); }
    catch (err) { toast.error('Failed to update.'); }
  };

  const handleReorder = async (id, direction) => {
    const idx = members.findIndex(m => m.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === members.length - 1) return;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    const order = members.map((m, i) => ({
      id: m.id,
      display_order: i === idx ? members[swapWith].display_order : i === swapWith ? members[idx].display_order : m.display_order
    }));
    try { await api.put('/cms/team/reorder', { order }); queryClient.invalidateQueries({ queryKey: ['admin-team'] }); }
    catch (err) { toast.error('Failed to reorder.'); }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/20 focus:border-konkan-green-primary transition-all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className=" text-2xl font-bold text-gray-900">Team Members</h1><p className="text-sm text-gray-500 mt-0.5">{members.length} members</p></div>
        <Button size="sm" onClick={openCreate}>+ Add Member</Button>
      </div>

      {isLoading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <div className="space-y-3">
          {members.map((m, idx) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <button onClick={() => handleReorder(m.id, 'up')} disabled={idx === 0} className={`p-1 rounded ${idx === 0 ? 'text-gray-200' : 'text-gray-400 hover:text-konkan-green-primary'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg></button>
                <button onClick={() => handleReorder(m.id, 'down')} disabled={idx === members.length - 1} className={`p-1 rounded ${idx === members.length - 1 ? 'text-gray-200' : 'text-gray-400 hover:text-konkan-green-primary'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg></button>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0">
                {m.image_url ? <img src={getImageUrl(m.image_url)} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-konkan-green-primary font-bold text-lg">{m.name?.charAt(0)}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">{m.name}</h3>
                <p className="text-xs text-gray-500">{m.designation || 'No designation'}{m.specialization ? ` · ${m.specialization}` : ''}</p>
                {m.experience_years > 0 && <p className="text-[10px] text-konkan-green-primary mt-0.5">{m.experience_years} years experience</p>}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleFeatured(m.id, !m.is_featured)} className={`px-2 py-1 rounded text-[10px] font-medium ${m.is_featured ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-400'}`}>{m.is_featured ? '★ Featured' : 'Feature'}</button>
                <button onClick={() => toggleActive(m.id, !m.is_active)} className={`px-2 py-1 rounded text-[10px] font-medium ${m.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'}`}>{m.is_active ? 'Active' : 'Inactive'}</button>
                <button onClick={() => openEdit(m)} className="text-xs text-konkan-green-primary font-medium hover:underline">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className=" text-lg font-bold text-gray-900">{editing ? 'Edit Member' : 'Add Member'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label><input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Designation</label><input className={inputClass} value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Founder & CEO" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Specialization</label><input className={inputClass} value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} placeholder="e.g. Supply Chain" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Short Bio</label><textarea className={`${inputClass} resize-none h-16`} value={form.short_bio} onChange={e => setForm({...form, short_bio: e.target.value})} placeholder="Brief description..." /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Biography</label><textarea className={`${inputClass} resize-none h-20`} value={form.biography} onChange={e => setForm({...form, biography: e.target.value})} placeholder="Detailed biography..." /></div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Profile Image</label>
                {/* Drag & Drop Upload Area */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageUpload(f); }}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'}`}
                  onClick={() => imageInputRef.current?.click()}
                >
                  {imageUploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </div>
                  ) : form.image_url ? (
                    <div className="relative">
                      <img src={getImageUrl(form.image_url)} alt="Preview" className="mx-auto max-h-32 rounded-lg object-contain" />
                      <p className="text-xs text-gray-400 mt-1">Click or drop to replace image</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <svg className="w-8 h-8 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs">Drop image here or click to browse</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP up to 5MB</p>
                    </div>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                </div>
                {/* Or paste URL */}
                <div className="mt-2">
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Or paste image URL</label>
                  <input className={inputClass} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input className={inputClass} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label><input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91-9876543210" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Experience (Years)</label><input className={inputClass} type="number" value={form.experience_years} onChange={e => setForm({...form, experience_years: e.target.value})} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Joining Date</label><input className={inputClass} type="date" value={form.joining_date} onChange={e => setForm({...form, joining_date: e.target.value})} /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma separated)</label><input className={inputClass} value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="Mango sourcing, Quality control, Logistics" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Achievements</label><textarea className={`${inputClass} resize-none h-16`} value={form.achievements} onChange={e => setForm({...form, achievements: e.target.value})} placeholder="Key achievements..." /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Certifications</label><textarea className={`${inputClass} resize-none h-16`} value={form.certifications} onChange={e => setForm({...form, certifications: e.target.value})} placeholder="Relevant certifications..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Instagram</label><input className={inputClass} value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="https://instagram.com/..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Facebook</label><input className={inputClass} value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} placeholder="https://facebook.com/..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn</label><input className={inputClass} value={form.linkedin} onChange={e => setForm({...form, linkedin: e.target.value})} placeholder="https://linkedin.com/..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">YouTube</label><input className={inputClass} value={form.youtube} onChange={e => setForm({...form, youtube: e.target.value})} placeholder="https://youtube.com/..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Twitter/X</label><input className={inputClass} value={form.twitter} onChange={e => setForm({...form, twitter: e.target.value})} placeholder="https://twitter.com/..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label><input className={inputClass} type="number" value={form.display_order} onChange={e => setForm({...form, display_order: e.target.value})} /></div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked ? 1 : 0})} className="rounded" /> Active</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked ? 1 : 0})} className="rounded" /> Featured</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button><Button size="sm" onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
