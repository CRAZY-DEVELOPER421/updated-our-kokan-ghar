'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function BlogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-blogs'],
    queryFn: async () => {
      const res = await api.get('/cms/blogs?limit=50');
      return res.data.data;
    },
  });

  const blogs = data?.blogs || [];

  const getCategoryColor = (name) => {
    const colors = [
      'from-konkan-green-primary/10 to-konkan-cream',
      'from-konkan-saffron/10 to-konkan-cream',
      'from-blue-500/10 to-konkan-cream',
      'from-purple-500/10 to-konkan-cream',
      'from-pink-500/10 to-konkan-cream',
      'from-teal-500/10 to-konkan-cream',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="animate-fade-in container-custom py-10 md:py-14">
      <Breadcrumb items={[{ label: 'Blog' }]} />
      <div className="text-center mb-10">
        <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary">Kokan Ghar Blog</h1>
        <p className="text-konkan-text-secondary mt-2 max-w-lg mx-auto">Stories, recipes, and tips from the heart of the Konkan coast.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading posts...</div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No blog posts published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <Link key={blog.id} href={`/blog/${blog.slug}`} className="bg-white rounded-xl card p-5 hover:shadow-card-hover transition-all group">
              {blog.hero_image ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden mb-3">
                  <Image src={blog.hero_image} alt={blog.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCategoryColor(blog.category_name)} flex items-center justify-center text-lg font-bold text-konkan-green-primary mb-3`}>
                  {(blog.category_name || 'B').charAt(0)}
                </div>
              )}
              {blog.category_name && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-konkan-saffron">{blog.category_name}</span>
              )}
              <h2 className="font-display text-base font-bold text-konkan-text-primary mt-1 group-hover:text-konkan-green-primary transition-colors line-clamp-2">{blog.title}</h2>
              <p className="text-xs text-konkan-text-secondary mt-1.5 line-clamp-2">{blog.excerpt || ''}</p>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-konkan-text-secondary">
                {blog.published_at && <span>{new Date(blog.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>}
                <span>{blog.view_count || 0} views</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
