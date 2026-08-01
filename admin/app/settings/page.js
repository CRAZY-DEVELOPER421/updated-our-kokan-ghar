'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import LogoCropper from '@/components/LogoCropper';

const SETTING_GROUPS = [
  {
    title: 'Phone Numbers',
    keys: ['phone_primary', 'phone_secondary'],
    labels: { phone_primary: 'Primary Phone', phone_secondary: 'Secondary Phone' },
    type: 'tel',
  },
  {
    title: 'Email Addresses',
    keys: ['email_primary', 'email_secondary', 'email_contact_form'],
    labels: { email_primary: 'Primary Email', email_secondary: 'Secondary Email', email_contact_form: 'Contact Form Email (messages sent here)' },
    type: 'email',
  },
  {
    title: 'Address',
    keys: ['address_line1', 'address_line2', 'address_city', 'address_country'],
    labels: { address_line1: 'Line 1', address_line2: 'Line 2', address_city: 'City / State / Pincode', address_country: 'Country' },
    type: 'text',
  },
  {
    title: 'Map',
    keys: ['map_embed_url', 'map_location_name'],
    labels: { map_embed_url: 'Google Maps Embed URL', map_location_name: 'Location Name' },
    type: 'text',
  },
  {
    title: 'Business Hours',
    keys: ['business_hours_weekday', 'business_hours_sunday', 'business_hours_holiday'],
    labels: { business_hours_weekday: 'Weekdays', business_hours_sunday: 'Sunday', business_hours_holiday: 'Holidays' },
    type: 'text',
  },
  {
    title: 'Social Media Links',
    keys: ['social_instagram', 'social_facebook', 'social_twitter', 'social_youtube', 'social_whatsapp', 'social_linkedin'],
    labels: { social_instagram: 'Instagram URL', social_facebook: 'Facebook URL', social_twitter: 'Twitter/X URL', social_youtube: 'YouTube URL', social_whatsapp: 'WhatsApp URL (https://wa.me/...)', social_linkedin: 'LinkedIn URL' },
    type: 'url',
  },
];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => { const res = await api.get('/admin/settings'); return res.data.data; },
  });

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({});

  // ── Logo & Branding state ──
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [cropSrc, setCropSrc] = useState(null);   // data URL being cropped
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const settings = data?.settings || {};
  const siteLogo = form.site_logo || '';
  const logoPreview = getImageUrl(siteLogo);

  // Initialize form from settings when data loads
  if (!dirty && Object.keys(settings).length > 0 && Object.keys(form).length === 0) {
    setForm({ ...settings });
    setDirty(true);
  }

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  // ── Logo handlers ──
  const handleLogoUrlApply = () => {
    const url = logoUrlInput.trim();
    if (!url) { toast.error('Paste a logo URL first.'); return; }
    handleChange('site_logo', url);
    setLogoUrlInput('');
    toast.success('Logo URL applied — don\'t forget to Save All Changes.');
  };

  const handleLogoFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = async (blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', blob, 'site-logo.png');
      const res = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data?.url;
      if (!url) throw new Error('No URL returned from upload.');
      handleChange('site_logo', url);
      toast.success('Logo cropped & uploaded — click Save All Changes to apply.');
      setCropSrc(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload logo.');
    }
    setUploading(false);
  };

  const handleLogoRemove = () => {
    if (!confirm('Remove the custom logo? The default logo will be used.')) return;
    handleChange('site_logo', '');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      toast.success('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    }
    setSaving(false);
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/20 focus:border-konkan-green-primary transition-all";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        <div className="text-center py-12 text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage branding, contact info, social links, map, and more</p>
        </div>
        <Button size="sm" onClick={handleSave} loading={saving}>Save All Changes</Button>
      </div>

      {/* ── Logo & Branding ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-[220px]">
            <h2 className="font-semibold text-gray-900 text-base">Logo &amp; Branding</h2>
            <p className="text-xs text-gray-500 mt-0.5">Set the site logo shown in the header and footer. Upload a file and crop it, or paste an image URL.</p>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Site logo preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center px-2">
                  <svg className="w-7 h-7 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-[10px] text-gray-400">No custom logo</span>
                </div>
              )}
            </div>
            {logoPreview && (
              <button onClick={handleLogoRemove} className="text-[11px] font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-all">Remove</button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload + Crop */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Upload from file
            </p>
            <p className="text-[11px] text-gray-400 mb-3">Choose an image, adjust the crop, and it will be uploaded automatically.</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose Image & Crop'}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFilePick} />
          </div>

          {/* Link */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 010 5.656l-4 4a4 4 0 01-5.656-5.656l1.5-1.5m13.5-1.5l1.5-1.5a4 4 0 00-5.656-5.656l-4 4a4 4 0 000 5.656" /></svg>
              Set via URL
            </p>
            <p className="text-[11px] text-gray-400 mb-3">Paste a direct link to an image (https://...) and apply it.</p>
            <div className="flex gap-2">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/20 focus:border-konkan-green-primary transition-all"
                value={logoUrlInput}
                onChange={e => setLogoUrlInput(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <Button size="sm" onClick={handleLogoUrlApply}>Apply</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SETTING_GROUPS.map((group) => (
          <div key={group.title} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900 text-base border-b border-gray-50 pb-2">{group.title}</h2>
            {group.keys.map((key) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{group.labels[key] || key}</label>
                {key === 'map_embed_url' ? (
                  <textarea
                    className={`${inputClass} resize-none h-16 font-mono text-[11px]`}
                    value={form[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                ) : key === 'email_contact_form' ? (
                  <div>
                    <input
                      className={inputClass}
                      type="email"
                      value={form[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="hello@kokanghar.in"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">All contact form submissions will be sent to this email address</p>
                  </div>
                ) : key.startsWith('social_') ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 shrink-0">
                      {key === 'social_instagram' && <InstagramIcon />}
                      {key === 'social_facebook' && <FacebookIcon />}
                      {key === 'social_twitter' && <TwitterIcon />}
                      {key === 'social_youtube' && <YouTubeIcon />}
                      {key === 'social_whatsapp' && <WhatsAppIcon />}
                      {key === 'social_linkedin' && <LinkedInIcon />}
                    </span>
                    <input
                      className={inputClass}
                      type="url"
                      value={form[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <input
                    className={inputClass}
                    type={group.type === 'email' ? 'email' : group.type === 'tel' ? 'tel' : 'text'}
                    value={form[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={`Enter ${group.labels[key]?.toLowerCase() || key}`}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} loading={saving}>Save All Changes</Button>
      </div>

      {/* Crop modal */}
      {cropSrc && (
        <LogoCropper
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

// ── Inline SVG Icons for social media ──

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
