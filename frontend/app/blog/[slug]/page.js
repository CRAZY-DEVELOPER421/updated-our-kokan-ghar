'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Breadcrumb from '@/components/ui/Breadcrumb';

function renderSection(section, idx) {
  switch (section.type) {
    case 'heading':
      const Tag = section.level || 'h2';
      return <Tag key={idx} className="font-display font-bold text-konkan-text-primary mt-8 mb-3" style={{ fontSize: Tag === 'h1' ? '1.75rem' : Tag === 'h2' ? '1.5rem' : '1.25rem' }}>{section.content}</Tag>;
    case 'text':
      return <p key={idx} className="text-konkan-text-secondary leading-relaxed mb-4">{section.content}</p>;
    case 'image':
      return (
        <figure key={idx} className="my-6 relative aspect-video">
          <Image src={section.url} alt={section.alt || ''} fill sizes="(max-width: 768px) 100vw, 768px" className="object-contain rounded-xl" loading="lazy" />
          {section.caption && <figcaption className="text-xs text-konkan-text-secondary text-center mt-2">{section.caption}</figcaption>}
        </figure>
      );
    case 'video':
      return (
        <div key={idx} className="my-6 aspect-video rounded-xl overflow-hidden bg-black">
          <iframe src={section.url?.replace('watch?v=', 'embed/').split('&')[0]} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={section.caption || 'Video'} />
          {section.caption && <p className="text-xs text-konkan-text-secondary text-center mt-2">{section.caption}</p>}
        </div>
      );
    case 'quote':
      return (
        <blockquote key={idx} className="my-6 pl-4 border-l-4 border-konkan-green-primary bg-konkan-cream/50 py-4 pr-4 rounded-r-xl">
          <p className="text-konkan-text-primary italic">&ldquo;{section.content}&rdquo;</p>
          {section.attribution && <cite className="text-sm text-konkan-text-secondary mt-2 block">&mdash; {section.attribution}</cite>}
        </blockquote>
      );
    case 'gallery':
      return (
        <div key={idx} className="grid grid-cols-2 md:grid-cols-3 gap-3 my-6">
          {Array.isArray(section.images) && section.images.map((img, i) => (
            <div key={i} className="relative aspect-square">
              <Image src={img} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover rounded-xl" loading="lazy" />
            </div>
          ))}
        </div>
      );
    case 'button':
      return (
        <div key={idx} className="my-6">
          <a href={section.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-konkan-green-primary text-white rounded-xl font-medium hover:bg-konkan-green-dark transition-colors">
            {section.text || 'Learn More'}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      );
    case 'list':
      return (
        <ul key={idx} className="list-disc pl-5 space-y-1.5 text-konkan-text-secondary mb-4">
          {Array.isArray(section.items) && section.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'table':
      return (
        <div key={idx} className="my-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {section.content?.split('\n').map((row, i) => (
              <tr key={i} className={i === 0 ? 'bg-konkan-cream font-semibold' : 'border-b border-gray-100'}>
                {row.split('|').map((cell, j) => <td key={j} className="px-3 py-2 text-konkan-text-primary">{cell.trim()}</td>)}
              </tr>
            ))}
          </table>
        </div>
      );
    default:
      return null;
  }
}

export default function BlogDetailPage({ params }) {
  const { slug } = use(params);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['public-blog', slug],
    queryFn: async () => { const res = await api.get(`/cms/blogs/slug/${slug}`); return res.data.data; },
  });

  if (isLoading) return <div className="container-custom py-12 text-center text-gray-500">Loading...</div>;
  if (!data?.blog) return <div className="container-custom py-12 text-center text-gray-400">Blog not found.</div>;

  const blog = data.blog;
  let sections = [];
  try { sections = typeof blog.content === 'string' ? JSON.parse(blog.content) : (Array.isArray(blog.content) ? blog.content : []); }
  catch { sections = []; }

  return (
    <div className="container-custom py-8 md:py-12">
      <Breadcrumb items={[{ label: 'Blog', href: '/blog' }, { label: blog.title }]} />

      <article className="max-w-3xl mx-auto">
        {/* Hero */}
        {blog.hero_image && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
            <Image src={blog.hero_image} alt={blog.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
          </div>
        )}

        <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary leading-tight">{blog.title}</h1>

        <div className="flex items-center gap-3 mt-4 text-sm text-konkan-text-secondary">
          {blog.author_name && <span>By {blog.author_name}</span>}
          {blog.published_at && <span>{new Date(blog.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
          {blog.category_name && <Link href={`/blog?category=${blog.category_id}`} className="text-konkan-green-primary hover:underline">{blog.category_name}</Link>}
          <span>{blog.view_count || 0} views</span>
        </div>

        {blog.excerpt && (
          <p className="text-lg text-konkan-text-secondary mt-6 leading-relaxed font-medium border-l-4 border-konkan-green-primary pl-4">{blog.excerpt}</p>
        )}

        {/* Content Sections */}
        <div className="mt-8">
          {sections.map((section, idx) => renderSection(section, idx))}
        </div>

        {/* Tags */}
        {blog.tags && (
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-konkan-sand">
            <span className="text-xs font-medium text-konkan-text-secondary">Tags:</span>
            {blog.tags.split(',').map((tag, i) => (
              <Link key={i} href={`/blog?search=${tag.trim()}`} className="px-2.5 py-1 bg-konkan-cream rounded-full text-[10px] text-konkan-text-secondary hover:bg-konkan-green-primary/10 hover:text-konkan-green-primary transition-colors">{tag.trim()}</Link>
            ))}
          </div>
        )}

        {/* Share Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-konkan-sand">
          <span className="text-xs font-medium text-konkan-text-secondary">Share:</span>
          {['Facebook', 'Twitter', 'WhatsApp', 'Email'].map(platform => {
            const url = currentUrl || (typeof window !== 'undefined' ? window.location.href : '');
            const shareUrls = {
              Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
              Twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(url)}`,
              WhatsApp: `https://wa.me/?text=${encodeURIComponent(blog.title + ' ' + url)}`,
              Email: `mailto:?subject=${encodeURIComponent(blog.title)}&body=${encodeURIComponent(url)}`,
            };
            return (
              <a key={platform} href={shareUrls[platform]} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-konkan-green-primary/10 hover:text-konkan-green-primary transition-colors">
                {platform}
              </a>
            );
          })}
        </div>

        {/* Related Blogs */}
        {blog.related?.length > 0 && (
          <div className="mt-12 pt-8 border-t border-konkan-sand">
            <h3 className="font-display text-xl font-bold text-konkan-text-primary mb-4">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blog.related.map(r => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="bg-white rounded-xl card p-4 hover:shadow-card-hover transition-all">
                  {r.hero_image && <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3"><Image src={r.hero_image} alt={r.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" loading="lazy" /></div>}
                  <h4 className="text-sm font-semibold text-konkan-text-primary line-clamp-2">{r.title}</h4>
                  <p className="text-[10px] text-konkan-text-secondary mt-1">{r.published_at ? new Date(r.published_at).toLocaleDateString() : ''}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
