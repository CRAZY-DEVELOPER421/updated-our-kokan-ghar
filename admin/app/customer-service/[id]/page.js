'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

const DEFAULT_FORM = {
  service_key: '',
  title: '',
  page_type: 'text',
  is_active: true,
  sort_order: 0,
  content: { sections: [{ heading: '', body: '', list: [] }] },
};

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function CustomerServiceEditorPage({ params }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const blockedRef = useRef(false);

  const { data: pageData, isLoading: pageLoading, isError: pageError } = useQuery({
    queryKey: ['admin-customer-service', id],
    queryFn: async () => {
      if (isNew) return null;
      const res = await api.get(`/admin/customer-service/${id}`);
      return res.data.data;
    },
    enabled: !isNew,
    retry: 1,
  });

  // Load page into the form once fetched
  useEffect(() => {
    if (isNew) return;
    if (pageLoading) return;
    if (pageData?.page) {
      const p = pageData.page;
      const content = p.content || (p.page_type === 'faq' ? { categories: [] } : { sections: [] });
      setForm({
        service_key: p.service_key || '',
        title: p.title || '',
        page_type: p.page_type || 'text',
        is_active: !!p.is_active,
        sort_order: p.sort_order || 0,
        content,
      });
    }
    setLoading(false);
  }, [pageData, pageLoading, isNew]);

  // Warn before closing/reloading the tab with unsaved changes (App Router has no
  // routeChangeStart event — nav buttons inside the app do their own dirty check).
  useEffect(() => {
    const handler = (e) => {
      if (!dirty || blockedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Guard in-app navigation (Cancel / Back arrow) with an unsaved-changes prompt
  const navigateAway = (href) => {
    if (dirty && !blockedRef.current) {
      blockedRef.current = true;
      if (!confirm('You have unsaved changes. Leave anyway?')) {
        blockedRef.current = false;
        return;
      }
    }
    router.push(href);
  };

  const patch = (updates) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setDirty(true);
  };

  // ── Text content helpers ──
  const patchSection = (idx, updates) => {
    const sections = [...(form.content?.sections || [])];
    sections[idx] = { ...sections[idx], ...updates };
    patch({ content: { ...form.content, sections } });
  };
  const addSection = () => {
    const sections = [...(form.content?.sections || []), { heading: '', body: '', list: [] }];
    patch({ content: { ...form.content, sections } });
  };
  const removeSection = (idx) => {
    const sections = (form.content?.sections || []).filter((_, i) => i !== idx);
    patch({ content: { ...form.content, sections } });
  };
  const patchSectionList = (idx, rawText) => {
    const list = rawText.split('\n').map((s) => s.trim()).filter(Boolean);
    patchSection(idx, { list });
  };

  // ── FAQ content helpers ──
  const patchCategory = (idx, updates) => {
    const categories = [...(form.content?.categories || [])];
    categories[idx] = { ...categories[idx], ...updates };
    patch({ content: { ...form.content, categories } });
  };
  const addCategory = () => {
    const categories = [...(form.content?.categories || []), { category: '', questions: [{ q: '', a: '' }] }];
    patch({ content: { ...form.content, categories } });
  };
  const removeCategory = (idx) => {
    const categories = (form.content?.categories || []).filter((_, i) => i !== idx);
    patch({ content: { ...form.content, categories } });
  };
  const patchQuestion = (catIdx, qIdx, updates) => {
    const categories = [...(form.content?.categories || [])];
    const questions = [...(categories[catIdx]?.questions || [])];
    questions[qIdx] = { ...questions[qIdx], ...updates };
    categories[catIdx] = { ...categories[catIdx], questions };
    patch({ content: { ...form.content, categories } });
  };
  const addQuestion = (catIdx) => {
    const categories = [...(form.content?.categories || [])];
    const questions = [...(categories[catIdx]?.questions || []), { q: '', a: '' }];
    categories[catIdx] = { ...categories[catIdx], questions };
    patch({ content: { ...form.content, categories } });
  };
  const removeQuestion = (catIdx, qIdx) => {
    const categories = [...(form.content?.categories || [])];
    const questions = (categories[catIdx]?.questions || []).filter((_, i) => i !== qIdx);
    categories[catIdx] = { ...categories[catIdx], questions };
    patch({ content: { ...form.content, categories } });
  };

  const switchType = (type) => {
    const base = { ...form, page_type: type };
    base.content = type === 'faq'
      ? (form.content?.categories ? form.content : { categories: [{ category: '', questions: [{ q: '', a: '' }] }] })
      : (form.content?.sections ? form.content : { sections: [{ heading: '', body: '', list: [] }] });
    setForm(base);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required.'); return; }
    if (!form.service_key.trim()) { toast.error('Service key is required (e.g. refund-policy).'); return; }

    const payload = {
      service_key: form.service_key.trim(),
      title: form.title.trim(),
      page_type: form.page_type,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
      content: form.content,
    };

    // Light validation of content
    if (form.page_type === 'text') {
      const sections = (form.content?.sections || []).filter((s) => s.heading.trim() || s.body.trim() || (s.list || []).length);
      if (sections.length === 0) { toast.error('Add at least one section with content.'); return; }
      payload.content = { sections };
    } else {
      const categories = (form.content?.categories || []).filter((c) => c.category.trim() && (c.questions || []).some((q) => q.q.trim() && q.a.trim()));
      if (categories.length === 0) { toast.error('Add at least one FAQ category with a question & answer.'); return; }
      payload.content = { categories };
    }

    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin/customer-service', payload);
        toast.success('Service page created!');
      } else {
        await api.put(`/admin/customer-service/${id}`, payload);
        toast.success('Service page updated!');
      }
      setDirty(false);
      router.push('/customer-service');
      router.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save page.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this service page permanently?')) return;
    try {
      await api.delete(`/admin/customer-service/${id}`);
      toast.success('Page deleted.');
      router.push('/customer-service');
      router.refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete page.');
    }
  };

  if (loading || (pageLoading && !isNew)) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="w-40 h-8" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
        <p className="text-sm font-medium text-slate-700 mb-3">Page not found.</p>
        <Link href="/customer-service"><Button size="sm" variant="ghost">← Back to Customer Service</Button></Link>
      </div>
    );
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";
  const isFaq = form.page_type === 'faq';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigateAway('/customer-service')} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isNew ? 'Add New Service' : 'Edit Service Page'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{isNew ? 'Create a customer service page for your storefront.' : `Editing "${form.title}"`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">      {!isNew && (
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-rose-500 hover:bg-rose-50">
          Delete
        </Button>
      )}
      <Button size="sm" onClick={handleSave} loading={saving}>
        {isNew ? 'Create Page' : 'Save Changes'}
      </Button>
        </div>
      </div>

      {/* Basics */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Page Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="e.g. Terms of Service"
            />
          </div>
          <div>
            <label className={labelClass}>Service Key *</label>
            <input
              className={inputClass}
              value={form.service_key}
              onChange={(e) => patch({ service_key: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
              placeholder="e.g. refund-policy (used in the URL)"
              disabled={!isNew}
            />
            {!isNew && <p className="text-[10px] text-slate-400 mt-1">Key can&apos;t be changed after creation.</p>}
          </div>
          <div>
            <label className={labelClass}>Page Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => switchType('text')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${!isFaq ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
              >
                Text / Sections
              </button>
              <button
                onClick={() => switchType('faq')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${isFaq ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
              >
                FAQ (Q&amp;A)
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Sort Order</label>
            <input
              className={inputClass}
              type="number"
              value={form.sort_order}
              onChange={(e) => patch({ sort_order: e.target.value })}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => patch({ is_active: e.target.checked })}
            className="w-4 h-4 rounded accent-emerald-600"
          />
          <span className="text-xs font-medium text-slate-600">Published (visible on storefront)</span>
        </label>
      </div>

      {/* Content builder */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">{isFaq ? 'FAQ Content' : 'Page Content'}</h2>
          {isFaq ? (
            <Button variant="ghost" size="sm" onClick={addCategory}>+ Add Category</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={addSection}>+ Add Section</Button>
          )}
        </div>

        {isFaq ? (
          <div className="space-y-4">
            {(form.content?.categories || []).map((cat, ci) => (
              <div key={ci} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <input
                    className={`${inputClass} bg-white`}
                    value={cat.category}
                    onChange={(e) => patchCategory(ci, { category: e.target.value })}
                    placeholder="Category name (e.g. Orders & Delivery)"
                  />
                  <button onClick={() => removeCategory(ci)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0" title="Remove category">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {(cat.questions || []).map((faq, qi) => (
                    <div key={qi} className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                      <input
                        className={inputClass}
                        value={faq.q}
                        onChange={(e) => patchQuestion(ci, qi, { q: e.target.value })}
                        placeholder="Question"
                      />
                      <textarea
                        className={`${inputClass} min-h-[70px] resize-y`}
                        value={faq.a}
                        onChange={(e) => patchQuestion(ci, qi, { a: e.target.value })}
                        placeholder="Answer"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => removeQuestion(ci, qi)}
                          className="text-[11px] font-medium text-slate-400 hover:text-rose-500 px-2 py-1 rounded hover:bg-rose-50 transition-all"
                        >
                          Remove question
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => addQuestion(ci)}>+ Add Question</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {(form.content?.sections || []).map((section, si) => (
              <div key={si} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded shrink-0">Section {si + 1}</span>
                  <input
                    className={`${inputClass} bg-white`}
                    value={section.heading}
                    onChange={(e) => patchSection(si, { heading: e.target.value })}
                    placeholder="Heading (e.g. 1. Acceptance of Terms)"
                  />
                  <button onClick={() => removeSection(si)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0" title="Remove section">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <textarea
                  className={`${inputClass} min-h-[90px] resize-y bg-white`}
                  value={section.body}
                  onChange={(e) => patchSection(si, { body: e.target.value })}
                  placeholder="Body text (paragraph)"
                />
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Bullet list (optional — one item per line)</label>
                  <textarea
                    className={`${inputClass} min-h-[60px] resize-y bg-white`}
                    value={(section.list || []).join('\n')}
                    onChange={(e) => patchSectionList(si, e.target.value)}
                    placeholder={'Item one\nItem two\nItem three'}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Live Preview</h2>
        <div className="border border-slate-200 rounded-xl bg-konkan-cream/30 p-4">
          <p className="font-display text-lg font-bold text-konkan-text-primary mb-3">{form.title || 'Untitled Page'}</p>
          {isFaq ? (
            <div className="space-y-4">
              {(form.content?.categories || []).map((cat, ci) => (
                <div key={ci}>
                  {cat.category && <p className="font-display text-sm font-bold text-konkan-green-primary mb-1.5">{cat.category}</p>}
                  <div className="space-y-1.5">
                    {(cat.questions || []).map((faq, qi) => (
                      <div key={qi} className="bg-white rounded-lg border border-slate-100 p-3">
                        <p className="text-xs font-medium text-slate-800">{faq.q || '…'}</p>
                        {faq.a && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{faq.a}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(form.content?.sections || []).map((section, si) => (
                <div key={si} className="bg-white rounded-lg border border-slate-100 p-3">
                  {section.heading && <p className="font-display text-sm font-bold text-slate-900 mb-1">{section.heading}</p>}
                  {section.body && <p className="text-[11px] text-slate-500 leading-relaxed">{section.body}</p>}
                  {section.list?.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 mt-1">
                      {section.list.map((item, i) => <li key={i} className="text-[11px] text-slate-500">{item}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="ghost" onClick={() => navigateAway('/customer-service')}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>{isNew ? 'Create Page' : 'Save Changes'}</Button>
      </div>
    </div>
  );
}
