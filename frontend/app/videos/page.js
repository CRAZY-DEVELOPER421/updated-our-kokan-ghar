'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Breadcrumb from '@/components/ui/Breadcrumb';

function VideoCard({ video, layout }) {
  const [hovering, setHovering] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isVertical = layout === 'reels' || layout === 'shorts';
  const formatDuration = (sec) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;
    return url;
  };

  return (
    <>
      <div
        className={`group cursor-pointer ${isVertical ? 'aspect-[9/16]' : 'aspect-video'} bg-gray-100 rounded-xl overflow-hidden relative hover:shadow-lg transition-shadow`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => setIsOpen(true)}
      >
        {hovering && video.video_url ? (
          <iframe
            src={getEmbedUrl(video.video_url)}
            className="w-full h-full pointer-events-none"
            style={{ border: 'none' }}
            allow="autoplay; encrypted-media"
            title={video.title}
          />
        ) : (
          <>
            {video.thumbnail_url ? (
              <Image src={video.thumbnail_url} alt={video.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-konkan-green-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </>
        )}
        {video.duration_seconds > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">{formatDuration(video.duration_seconds)}</div>
        )}
        {/* Bottom gradient overlay for text */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent p-3 flex flex-col justify-end">
          <h2 className="text-white text-sm font-semibold line-clamp-1">{video.title}</h2>
          <div className="flex items-center gap-2 text-white/70 text-[10px]">
            <span>{video.view_count || 0} views</span>
            {video.category_name && <span>{video.category_name}</span>}
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <iframe
                src={video.video_url?.replace('watch?v=', 'embed/').split('&')[0] + '?autoplay=1'}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={video.title}
              />
            </div>
            <div className="mt-4 text-white">
              <h2 className="text-xl font-bold">{video.title}</h2>
              {video.description && <p className="text-sm text-white/70 mt-2">{video.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm text-white/60">
                <span>{video.view_count || 0} views</span>
                <button className="flex items-center gap-1 hover:text-white"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Like</button>
                <button className="flex items-center gap-1 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg> Share</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function VideosPage() {
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['public-videos', activeTab],
    queryFn: async () => {
      const params = activeTab === 'all' ? 'limit=50' : `type=${activeTab}&limit=50`;
      const res = await api.get(`/cms/videos?${params}`);
      return res.data.data;
    },
  });

  const videos = data?.videos || [];

  const tabs = [
    { key: 'all', label: 'All Videos', layout: 'mixed' },
    { key: 'reels', label: 'Reels', layout: 'reels' },
    { key: 'shorts', label: 'Shorts', layout: 'shorts' },
    { key: 'long', label: 'Long Videos', layout: 'long' },
    { key: 'tutorial', label: 'Tutorials', layout: 'long' },
    { key: 'product', label: 'Product Videos', layout: 'long' },
    { key: 'customer_story', label: 'Stories', layout: 'long' },
  ];

  const currentLayout = tabs.find(t => t.key === activeTab)?.layout || 'mixed';
  const isVerticalLayout = currentLayout === 'reels' || currentLayout === 'shorts';

  return (
    <div className="container-custom py-8 md:py-12">
      <Breadcrumb items={[{ label: 'Videos' }]} />
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary mt-2">Videos</h1>
        <p className="text-konkan-text-secondary mt-1">Explore our collection of videos from the Konkan coast</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === tab.key ? 'bg-konkan-green-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
        ))}
      </div>

      {isLoading ? <div className="text-center py-12 text-gray-500">Loading videos...</div> : (
        <>
          {isVerticalLayout ? (
            /* Reels/Shorts - Vertical Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {videos.map(v => <VideoCard key={v.id} video={v} layout={currentLayout} />)}
            </div>
          ) : (
            /* Long Videos - Horizontal Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(v => <VideoCard key={v.id} video={v} layout="long" />)}
            </div>
          )}
          {videos.length === 0 && <p className="text-center py-12 text-gray-400">No videos found in this category.</p>}
        </>
      )}
    </div>
  );
}
