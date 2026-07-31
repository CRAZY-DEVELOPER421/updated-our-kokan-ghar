'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function AdminBlogsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => { const res = await api.get('/cms/blogs?all=true&limit=100'); return res.data.data; },
  });

  const blogs = data?.blogs || [];

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog post?')) return;
    try { await api.delete(`/cms/blogs/${id}`); toast.success('Blog deleted.'); queryClient.invalidateQueries({ queryKey: ['admin-blogs'] }); }
    catch (err) { toast.error('Failed to delete.'); }
  };

  const togglePublish = async (blog) => {
    try {
      await api.put(`/cms/blogs/${blog.id}`, { is_published: blog.is_published ? 0 : 1 });
      toast.success(blog.is_published ? 'Unpublished' : 'Published!');
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
    } catch (err) { toast.error('Failed to update.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className=" text-2xl font-bold text-gray-900">Blogs</h1><p className="text-sm text-gray-500 mt-0.5">{data?.pagination?.total || blogs.length} posts</p></div>
        <Link href="/blogs/create" className="inline-flex items-center px-4 py-2 bg-konkan-green-primary text-white text-sm font-medium rounded-xl hover:bg-konkan-green-dark transition-colors">+ New Blog</Link>
      </div>

      {isLoading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <div className="space-y-3">
          {blogs.length === 0 && <p className="text-center py-12 text-gray-400">No blogs yet. Create your first blog post!</p>}
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                {blog.hero_image ? <img src={blog.hero_image} alt={blog.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{blog.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {blog.category_name && <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">{blog.category_name}</span>}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${blog.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>{blog.is_published ? 'Published' : 'Draft'}</span>
                  {blog.is_featured ? <span className="text-[10px] text-purple-600">★ Featured</span> : null}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{blog.view_count || 0} views{blog.published_at ? ` · ${new Date(blog.published_at).toLocaleDateString()}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => togglePublish(blog)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${blog.is_published ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{blog.is_published ? 'Unpublish' : 'Publish'}</button>
                <Link href={`/blogs/${blog.id}`} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-konkan-cream text-konkan-green-primary hover:bg-konkan-green-primary/10">Edit</Link>
                <button onClick={() => handleDelete(blog.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
