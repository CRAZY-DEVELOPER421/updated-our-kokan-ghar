'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminNavbarPage() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-navbar'] });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-navbar'],
    queryFn: async () => (await api.get('/navbar/all')).data.data,
  });

  const items = data?.items || [];

  // ── Add form state ──
  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('');

  // ── Inline edit state: { id: { label, href } } ──
  const [editing, setEditing] = useState({});
  const startEdit = (item) =>
    setEditing((prev) => ({ ...prev, [item.id]: { label: item.label, href: item.href } }));
  const cancelEdit = (id) =>
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const handleAdd = async () => {
    if (!newLabel.trim() || !newHref.trim()) {
      toast.error('Label and link are required.');
      return;
    }
    try {
      await api.post('/navbar', { label: newLabel.trim(), href: newHref.trim() });
      toast.success('Navbar item added.');
      setNewLabel('');
      setNewHref('');
      invalidate();
    } catch {
      toast.error('Failed to add item.');
    }
  };

  const handleSaveEdit = async (id) => {
    const edit = editing[id];
    if (!edit || !edit.label.trim() || !edit.href.trim()) {
      toast.error('Label and link are required.');
      return;
    }
    try {
      await api.put(`/navbar/${id}`, { label: edit.label.trim(), href: edit.href.trim() });
      toast.success('Saved.');
      cancelEdit(id);
      invalidate();
    } catch {
      toast.error('Failed to save.');
    }
  };

  const handleDelete = async (id, label) => {
    if (!confirm(`Remove "${label}" from the navbar? Only the nav link is removed — products, pages and all data stay untouched.`)) return;
    try {
      await api.delete(`/navbar/${id}`);
      toast.success('Navbar item removed.');
      invalidate();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/navbar/${item.id}`, { is_active: item.is_active ? 0 : 1 });
      toast.success(item.is_active ? 'Hidden from navbar' : 'Shown on navbar');
      invalidate();
    } catch {
      toast.error('Failed to update.');
    }
  };

  // Swap sort_order with the neighbour item (same pattern as hero sliders)
  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[index];
    const b = items[j];
    try {
      await Promise.all([
        api.put(`/navbar/${a.id}`, { sort_order: b.sort_order }),
        api.put(`/navbar/${b.id}`, { sort_order: a.sort_order }),
      ]);
      invalidate();
    } catch {
      toast.error('Reorder failed.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Navbar Manager</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {items.length} link{items.length === 1 ? '' : 's'} · order = display order on the storefront navbar.
          Removing a link only hides it from the navbar — nothing else changes.
        </p>
      </div>

      {/* Add new item */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Add Navbar Link</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. Deals)"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/40"
          />
          <input
            value={newHref}
            onChange={(e) => setNewHref(e.target.value)}
            placeholder="Link (e.g. /offers or /products?region=goa)"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/40"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-konkan-green-primary text-white text-sm font-medium rounded-lg hover:bg-konkan-green-dark transition-colors"
          >
            + Add Link
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Start links with &quot;/&quot; — internal pages only. Example: <code>/offers</code>, <code>/products?region=goa</code>, <code>/#shop-by-region</code>
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 mb-3">No navbar links yet. Add your first link above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {items.map((item, i) => {
            const edit = editing[item.id];
            return (
              <div key={item.id} className="p-4 flex items-center gap-3">
                {/* Order number */}
                <span className="w-7 h-7 rounded-full bg-konkan-cream text-konkan-green-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>

                {/* Info / inline edit */}
                <div className="flex-1 min-w-0">
                  {edit ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={edit.label}
                        onChange={(e) => setEditing((p) => ({ ...p, [item.id]: { ...p[item.id], label: e.target.value } }))}
                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                        placeholder="Label"
                      />
                      <input
                        value={edit.href}
                        onChange={(e) => setEditing((p) => ({ ...p, [item.id]: { ...p[item.id], href: e.target.value } }))}
                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm flex-1"
                        placeholder="/path"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {item.label}
                        {item.label_key && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">
                            {item.label_key}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono truncate">{item.href}</p>
                    </>
                  )}
                </div>

                {/* Status */}
                {!edit && (
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${item.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    {item.is_active ? 'Visible' : 'Hidden'}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex flex-col gap-0.5 mr-1">
                    <button
                      onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
                      className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down"
                      className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  {edit ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(item.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleActive(item)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${item.is_active ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                      >
                        {item.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-konkan-cream text-konkan-green-primary hover:bg-konkan-green-primary/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.label)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
