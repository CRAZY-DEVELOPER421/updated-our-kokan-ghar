'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, use } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

let sectionIdCounter = 0;
const nextId = () => ++sectionIdCounter;

const SECTION_TYPES = [
  { type: 'heading', label: 'Heading', icon: 'H' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: '🖼' },
  { type: 'video', label: 'Video', icon: '▶' },
  { type: 'quote', label: 'Quote', icon: '"' },
  { type: 'gallery', label: 'Gallery', icon: '📷' },
  { type: 'button', label: 'Button', icon: '🔗' },
  { type: 'list', label: 'List', icon: '•' },
  { type: 'table', label: 'Table', icon: '⊞' },
];

function SectionEditor({ section, index, onUpdate, onDelete, onDragStart, onDragOver, onDragEnd, onDragLeave, isDragging, isFirst, isLast }) {
  const renderEditor = () => {
    switch (section.type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <select value={section.level || 'h2'} onChange={e => onUpdate({ ...section, level: e.target.value })} className="text-xs border rounded px-2 py-1">
              <option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
            </select>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={section.content || ''} onChange={e => onUpdate({ ...section, content: e.target.value })} placeholder="Heading text..." />
          </div>
        );
      case 'text':
        return (
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]" value={section.content || ''} onChange={e => onUpdate({ ...section, content: e.target.value })} placeholder="Write your content here..." />
        );
      case 'image':
        return (
          <div className="space-y-2">
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={section.url || ''} onChange={e => onUpdate({ ...section, url: e.target.value })} placeholder="Image URL..." />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={section.alt || ''} onChange={e => onUpdate({ ...section, alt: e.target.value })} placeholder="Alt text..." />
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={section.url || ''} onChange={e => onUpdate({ ...section, url: e.target.value })} placeholder="Video URL..." />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={section.caption || ''} onChange={e => onUpdate({ ...section, caption: e.target.value })} placeholder="Caption..." />
          </div>
        );
      case 'quote':
        return (
          <div className="space-y-2">
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" value={section.content || ''} onChange={e => onUpdate({ ...section, content: e.target.value })} placeholder="Quote..." />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={section.attribution || ''} onChange={e => onUpdate({ ...section, attribution: e.target.value })} placeholder="Author..." />
          </div>
        );
      case 'gallery':
        return (
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" value={Array.isArray(section.images) ? section.images.join('\n') : ''} onChange={e => onUpdate({ ...section, images: e.target.value.split('\n').filter(Boolean) })} placeholder="One URL per line..." rows={3} />
        );
      case 'button':
        return (
          <div className="flex gap-2">
            <input className="flex-1 border rounded-lg px-3 py-2 text-sm" value={section.text || ''} onChange={e => onUpdate({ ...section, text: e.target.value })} placeholder="Button text..." />
            <input className="flex-1 border rounded-lg px-3 py-2 text-sm" value={section.url || ''} onChange={e => onUpdate({ ...section, url: e.target.value })} placeholder="https://..." />
          </div>
        );
      case 'list':
        return (
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]" value={Array.isArray(section.items) ? section.items.join('\n') : ''} onChange={e => onUpdate({ ...section, items: e.target.value.split('\n').filter(Boolean) })} placeholder="One per line..." rows={4} />
        );
      case 'table':
        return (
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm font-mono min-h-[80px]" value={section.content || ''} onChange={e => onUpdate({ ...section, content: e.target.value })} placeholder="Markdown table..." />
        );
      default:
        return null;
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(index); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(index); }}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
      className={`rounded-xl border p-4 transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'border-konkan-green-primary shadow-lg opacity-50 ring-2 ring-konkan-green-primary/20' : 'border-gray-200 hover:border-konkan-green-primary/30 hover:shadow-sm bg-white'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-gray-400 cursor-grab" title="Drag to reorder">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16"/></svg>
          </span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-500">{section.type}</span>
          <span className="text-[10px] text-gray-400">#{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className={`p-1 rounded ${isFirst ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-konkan-green-primary hover:bg-konkan-green-primary/10'}`} title="Move up"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg></button>
          <button onClick={onMoveDown} disabled={isLast} className={`p-1 rounded ${isLast ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-konkan-green-primary hover:bg-konkan-green-primary/10'}`} title="Move down"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg></button>
          <span className="text-gray-200">|</span>
          <button onClick={onDelete} className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-50" title="Delete section"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
        </div>
      </div>
      {renderEditor()}
    </div>
  );
}

export default function AdminBlogEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const dragRef = useRef(null);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndexRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const { data: blogData } = useQuery({
    queryKey: ['admin-blog', id],
    queryFn: async () => { const res = await api.get(`/cms/blogs/${id}`); return res.data.data; },
    enabled: !!id,
  });

  const { data: catData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => { const res = await api.get('/cms/blog-categories'); return res.data.data; },
  });

  useEffect(() => {
    if (blogData?.blog && !loaded) {
      const b = blogData.blog;
      setTitle(b.title || '');
      setExcerpt(b.excerpt || '');
      setCategoryId(b.category_id || '');
      setAuthorName(b.author_name || '');
      setHeroImage(b.hero_image || '');
      setTags(b.tags || '');
      setIsPublished(!!b.is_published);
      setIsFeatured(!!b.is_featured);
      try {
        const parsed = typeof b.content === 'string' ? JSON.parse(b.content) : (Array.isArray(b.content) ? b.content : []);
        // Assign unique _id to each section for drag-and-drop tracking
        const withIds = parsed.map(s => ({ ...s, _id: nextId() }));
        setSections(withIds);
      } catch { setSections([]); }
      setLoaded(true);
    }
  }, [blogData, loaded]);

  const createDefaultSection = (type) => {
    const base = { _id: nextId(), type };
    switch (type) {
      case 'heading': return { ...base, level: 'h2', content: '' };
      case 'text': return { ...base, content: '' };
      case 'image': return { ...base, url: '', alt: '', caption: '' };
      case 'video': return { ...base, url: '', caption: '' };
      case 'quote': return { ...base, content: '', attribution: '' };
      case 'gallery': return { ...base, images: [] };
      case 'button': return { ...base, text: '', url: '' };
      case 'list': return { ...base, items: [] };
      case 'table': return { ...base, content: '' };
      default: return base;
    }
  };

  const addSection = (type) => {
    setSections(prev => [...prev, createDefaultSection(type)]);
  };

  const updateSection = (idx, updated) => {
    setSections(prev => { const ns = [...prev]; ns[idx] = updated; return ns; });
  };

  const deleteSection = (idx) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const moveSection = (idx, direction) => {
    setSections(prev => {
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === prev.length - 1)) return prev;
      const ns = [...prev];
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      [ns[idx], ns[swap]] = [ns[swap], ns[idx]];
      return ns;
    });
  };

  // Drag & Drop handlers
  const handleDragStart = (idx) => {
    dragIndexRef.current = idx;
    setDragOverIndex(idx);
  };

  const handleDragOver = (idx) => {
    const fromIdx = dragIndexRef.current;
    if (fromIdx === null || fromIdx === idx) return;
    setSections(prev => {
      const ns = [...prev];
      const [moved] = ns.splice(fromIdx, 1);
      ns.splice(idx, 0, moved);
      return ns;
    });
    dragIndexRef.current = idx;
    setDragOverIndex(idx);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {};

  const handleSave = async (publish = false) => {
    if (!title.trim()) { toast.error('Title is required.'); return; }
    setSaving(true);
    try {
      const cleanSections = sections.map(({ _id, ...rest }) => rest);
      const payload = {
        title, excerpt, content: JSON.stringify(cleanSections), category_id: categoryId || null,
        author_name: authorName, hero_image: heroImage, tags,
        is_published: publish ? 1 : (isPublished ? 1 : 0), is_featured: isFeatured ? 1 : 0,
        meta_title: title, meta_description: excerpt,
      };
      await api.put(`/cms/blogs/${id}`, payload);
      toast.success(publish ? 'Blog published!' : 'Saved!');
      queryClient.invalidateQueries({ queryKey: ['admin-blog', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className=" text-2xl font-bold text-gray-900">Edit Blog Post</h1>
        <div className="flex items-center gap-2">
          {!isPublished && <Button variant="ghost" size="sm" onClick={() => handleSave(false)} loading={saving}>Save Draft</Button>}
          <Button size="sm" onClick={() => handleSave(!isPublished)} loading={saving}>{isPublished ? 'Update' : 'Publish'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/20 focus:border-konkan-green-primary" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title..." />
          <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none h-20" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Excerpt..." />
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none" value={heroImage} onChange={e => setHeroImage(e.target.value)} placeholder="Hero image URL..." />
          <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Author name..." />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Content Builder</h3>
              <span className="text-xs text-gray-400">{sections.length} sections &middot; Drag to reorder</span>
            </div>

            {sections.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-sm text-gray-400">No content sections yet. Click a block type below to add one.</p>
              </div>
            )}

            {sections.map((section, idx) => (
              <SectionEditor
                key={section._id}
                section={section}
                index={idx}
                onUpdate={(updated) => updateSection(idx, updated)}
                onDelete={() => deleteSection(idx)}
                onMoveUp={() => moveSection(idx, 'up')}
                onMoveDown={() => moveSection(idx, 'down')}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                isDragging={dragOverIndex === idx}
                isFirst={idx === 0}
                isLast={idx === sections.length - 1}
              />
            ))}

            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              {SECTION_TYPES.map(st => (
                <button key={st.type} onClick={() => addSection(st.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-konkan-green-primary hover:text-konkan-green-primary hover:bg-konkan-green-primary/10 transition-all">
                  <span>{st.icon}</span> {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Category</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Uncategorized</option>{(catData?.categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Tags</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={tags} onChange={e => setTags(e.target.value)} placeholder="mango, recipes" /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="rounded" /> Featured</label>
            <p className="text-xs text-gray-400">{isPublished ? '✓ Published' : '○ Draft'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
