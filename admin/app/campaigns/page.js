'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getImageUrl, getStorefrontUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function getCampaignStatus(c) {
  const now = new Date();
  const start = c.starts_at ? new Date(c.starts_at) : null;
  const end = c.ends_at ? new Date(c.ends_at) : null;
  if (!c.is_active) return { label: 'Inactive', color: 'bg-slate-100 text-slate-500' };
  if (end && now > end) return { label: 'Ended', color: 'bg-slate-100 text-slate-500' };
  if (start && now < start) return { label: 'Upcoming', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Live', color: 'bg-emerald-50 text-emerald-700' };
}

// Mini page preview thumbnail: hero strip (banner/theme) + section chips with
// real product thumbnails — a quick visual of what the campaign page looks like.
function CampaignMiniPreview({ campaign }) {
  const theme = campaign.theme_color || '#2D6A4F';
  const banner = campaign.banner_image_url || campaign.mobile_banner_image_url;
  const sections = campaign.preview?.sections || [];
  const pageBg = campaign.page_bg_type;

  return (
    <div className="w-36 h-24 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm group-hover:shadow-md transition-shadow shrink-0 relative">
      {/* Page background hint (color/image/video) */}
      {pageBg && pageBg !== 'transparent' && (
        <div className="absolute inset-0" style={{ backgroundColor: campaign.page_bg_color || `${theme}1A` }} />
      )}

      {/* Hero strip */}
      <div className="relative h-[46%] overflow-hidden" style={{ background: banner ? undefined : `linear-gradient(135deg, ${theme} 0%, ${theme}99 55%, #1B3B2F 100%)` }}>
        {banner ? (
          <img src={getImageUrl(banner)} alt={campaign.name} className="w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1 pb-0.5 pt-4">
          <p className="text-[7px] font-bold text-white truncate leading-tight drop-shadow">{campaign.name}</p>
        </div>
      </div>

      {/* Sections strip */}
      <div className="relative h-[54%] p-1 flex items-stretch gap-1">
        {sections.length === 0 ? (
          <span className="text-[7px] text-slate-400 flex items-center justify-center w-full">No sections</span>
        ) : (
          sections.slice(0, 3).map((s, i) => (
            s.section_type === 'products' ? (
              <div key={i} className="flex-1 min-w-0 rounded-[3px] bg-slate-50 border border-slate-100 flex items-center justify-center gap-px px-0.5">
                {s.product_images.length > 0 ? (
                  s.product_images.slice(0, 3).map((img, j) => (
                    <img key={j} src={getImageUrl(img)} alt="" className="w-[18px] h-[18px] rounded-[2px] object-cover border border-white" />
                  ))
                ) : (
                  <span className="text-[8px] font-bold" style={{ color: theme }}>▦</span>
                )}
              </div>
            ) : (
              <div key={i} className="flex-1 min-w-0 rounded-[3px] flex items-center justify-center" style={{ backgroundColor: `${theme}14` }}>
                <span className="text-[8px] font-bold" style={{ color: theme }}>
                  {s.section_type === 'story' ? 'Aa' : s.section_type === 'blog' ? 'B' : '✦'}
                </span>
              </div>
            )
          ))
        )}
        {sections.length > 3 && (
          <span className="text-[7px] text-slate-400 self-center shrink-0">+{sections.length - 3}</span>
        )}
      </div>
    </div>
  );
}

export default function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const res = await api.get('/admin/campaigns');
      return res.data.data;
    },
    retry: 1,
  });

  const allCampaigns = data?.campaigns || [];
  const campaigns = search
    ? allCampaigns.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()))
    : allCampaigns;

  const handleDelete = async (c) => {
    if (!confirm(`Delete campaign "${c.name}"? The page at /campaign/${c.slug} will stop working.`)) return;
    try {
      await api.delete(`/admin/campaigns/${c.id}`);
      toast.success('Campaign deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete campaign.'); }
  };

  const handleToggle = async (c) => {
    try {
      await api.put(`/admin/campaigns/${c.id}`, { is_active: c.is_active ? 0 : 1 });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      toast.success(c.is_active ? 'Campaign deactivated' : 'Campaign activated');
    } catch (err) { toast.error('Failed to update campaign.'); }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-40 h-8 mb-1" /><Skeleton className="w-24 h-4" /></div>
          <Skeleton className="w-28 h-9 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <Skeleton className="w-24 h-14 rounded-xl" />
              <div className="flex-1"><Skeleton className="w-48 h-4 mb-1" /><Skeleton className="w-32 h-3" /></div>
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load campaigns</span>
            <button onClick={() => refetch()} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Festive Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
            {search && <span className="text-slate-400 ml-1">(filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <Link href="/campaigns/new"><Button size="sm">+ New Campaign</Button></Link>
        </div>
      </div>

      {/* Info strip */}
      <div className="bg-konkan-saffron/10 border border-konkan-saffron/20 rounded-xl px-4 py-3 text-xs text-slate-600 flex items-start gap-2.5">
        <svg className="w-4 h-4 text-konkan-saffron shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Each campaign renders a festive landing page at <code className="font-mono bg-white px-1 py-0.5 rounded text-konkan-saffron">/campaign/&lt;slug&gt;</code> — full-page background, unlimited sections (products 5-per-row or scroll, stories, blog posts), countdown. Point any banner or hero-slider link to that URL to promote it — no code needed.
        </span>
      </div>

      {/* Empty state */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1l2.4 7.6L22 11l-7.6 2.4L12 21l-2.4-7.6L2 11l7.6-2.4L12 1z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">{search ? 'No campaigns matching your search' : 'No campaigns yet'}</span>
            <p className="text-xs text-slate-400">
              {search
                ? 'Try a different search term.'
                : 'Create festive collection pages (Ganesh Chaturthi, Diwali, Holi…) with their own theme, banner, countdown and curated products.'}
            </p>
            {!search && (
              <Link href="/campaigns/new"><Button size="sm">+ Create Campaign</Button></Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const status = getCampaignStatus(c);
            return (
              <div key={c.id} className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/10 transition-all duration-200">
                <div className="p-4 flex items-center gap-4">
                  {/* Mini page preview thumb */}
                  <Link href={`/campaigns/${c.id}`} title={`Preview: ${c.name}`}>
                    <CampaignMiniPreview campaign={c} />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/campaigns/${c.id}`} className="font-semibold text-slate-900 text-sm truncate max-w-[240px] group-hover:text-emerald-700 transition-colors">{c.name}</Link>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${status.color}`}>{status.label}</span>
                      {c.tagline && <span className="text-[10px] text-slate-400 truncate max-w-[220px] hidden md:inline">{c.tagline}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400">/campaign/{c.slug}</span>
                      <span className="text-[10px] text-slate-400">· {c.product_count || 0} product{(c.product_count || 0) !== 1 ? 's' : ''}</span>
                      {c.section_count > 0 && (
                        <span className="text-[10px] text-slate-400">· {c.section_count} section{c.section_count !== 1 ? 's' : ''}</span>
                      )}
                      {c.ends_at && (
                        <span className="text-[10px] text-slate-400">· ends {new Date(c.ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>
                    {/* Theme swatch */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-200" style={{ backgroundColor: c.theme_color || '#2D6A4F' }} />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{c.theme_color || '#2D6A4F'}</span>
                    </div>
                  </div>

                  {/* View on site */}
                  <a
                    href={getStorefrontUrl(`/campaign/${c.slug}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-all shrink-0"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    View
                  </a>

                  {/* Toggle */}
                  <button onClick={() => handleToggle(c)} className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${c.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`} aria-label={c.is_active ? 'Deactivate campaign' : 'Activate campaign'}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${c.is_active ? 'translate-x-5' : ''}`} />
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/campaigns/${c.id}`} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-all">Edit</Link>
                    <button onClick={() => handleDelete(c)} className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-all">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
