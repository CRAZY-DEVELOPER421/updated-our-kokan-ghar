'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Mail, Clock, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

const quickLinks = [
  { key: 'about_us', href: '/about', ns: 'footer' },
  { key: 'view_all', href: '/products', ns: 'common' },
  { key: 'mangoes_fruits', href: '/categories/konkan-mangoes-fruits', ns: 'nav' },
  { key: 'cashew_dry_fruits', href: '/categories/cashew-dry-fruits', ns: 'nav' },
  { key: 'seafood_coastal', href: '/categories/coastal-seafood', ns: 'nav' },
  { key: 'offers', href: '/offers', ns: 'nav' },
  { key: 'blog', href: '/blog', ns: 'nav' },
];

const supportLinks = [
  { key: 'contact_us', href: '/contact', ns: 'footer' },
  { key: 'faq', href: '/faq', ns: 'footer' },
  { key: 'shipping_policy', href: '/shipping-policy', ns: 'footer' },
  { key: 'return_policy', href: '/return-policy', ns: 'footer' },
  { key: 'terms_of_service', href: '/terms', ns: 'footer' },
  { key: 'privacy_policy', href: '/privacy', ns: 'footer' },
];

// ── Social SVG Icons ──

function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TwitterIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function WhatsAppIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const SOCIAL_MAP = {
  social_instagram: { icon: InstagramIcon, label: 'Instagram' },
  social_facebook: { icon: FacebookIcon, label: 'Facebook' },
  social_twitter: { icon: TwitterIcon, label: 'Twitter' },
  social_youtube: { icon: YouTubeIcon, label: 'YouTube' },
  social_whatsapp: { icon: WhatsAppIcon, label: 'WhatsApp' },
  social_linkedin: { icon: LinkedInIcon, label: 'LinkedIn' },
};

const SOCIAL_KEYS = ['social_instagram', 'social_facebook', 'social_twitter', 'social_youtube', 'social_whatsapp', 'social_linkedin'];

export default function Footer() {
  const { t } = useTranslation();

  // Fetch settings for social links & contact info
  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => { const res = await api.get('/settings'); return res.data.data; },
    staleTime: 5 * 60 * 1000,
  });

  const s = settingsData?.settings || {};
  const activeSocials = SOCIAL_KEYS.filter(k => s[k]);
  const phone = s.phone_primary || '+919876543210';
  const email = s.email_primary || 'hello@kokanghar.in';
  const customLogo = getImageUrl(s.site_logo);

  return (
    <footer className="text-konkan-cream" style={{ backgroundColor: '#3D2B1F', backgroundImage: 'none' }}>
      {/* Main Footer */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1 - Logo & About */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              {customLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customLogo} alt="Kokan Ghar Logo" className="h-12 w-auto" />
              ) : (
                <Image
                  src="/images/logo/footer.png"
                  alt="Kokan Ghar Logo"
                  width={140}
                  height={48}
                  loading="lazy"
                />
              )}
            </Link>
            <p className="text-konkan-sand/80 text-sm leading-relaxed mb-6">
              {t('footer.description')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {activeSocials.length > 0 ? (
                activeSocials.map((key) => {
                  const meta = SOCIAL_MAP[key];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <a
                      key={key}
                      href={s[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-konkan-green-primary transition-all duration-200 text-konkan-sand/80 hover:text-white"
                      aria-label={meta.label}
                      title={meta.label}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })
              ) : (
                <>
                  <a href="https://facebook.com/konkanbazaar" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-konkan-green-primary transition-all duration-200 text-konkan-sand/80">
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                  <a href="https://instagram.com/konkanbazaar" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-konkan-green-primary transition-all duration-200 text-konkan-sand/80">
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                  <a href="https://twitter.com/konkanbazaar" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-konkan-green-primary transition-all duration-200 text-konkan-sand/80">
                    <TwitterIcon className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Column 2+3 - Quick Links + Customer Support side by side on mobile */}
          <div className="md:col-span-1 lg:col-span-2">
            <div className="flex flex-row gap-6 sm:gap-8">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-bold text-white mb-5">{t('footer.quick_links')}</h3>
                <ul className="space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="flex items-center gap-1.5 text-konkan-sand/80 hover:text-konkan-gold text-sm transition-colors group">
                        <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                        {t(`${link.ns}.${link.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-bold text-white mb-5">{t('footer.customer_service')}</h3>
                <ul className="space-y-3">
                  {supportLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="flex items-center gap-1.5 text-[#8A8A8A] hover:text-konkan-gold text-sm transition-colors group">
                        <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                        {t(`${link.ns}.${link.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Column 4 - Contact Info */}
          <div>
            <h3 className="font-display text-base font-bold text-white mb-5">{t('footer.contact_us')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-konkan-gold shrink-0" />
                <span className="text-[#8A8A8A] text-sm">
                  {s.address_line1 || 'Kokan Ghar Pvt. Ltd.'}<br />
                  {s.address_city || 'Mapusa, Goa — 403507'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-konkan-gold shrink-0" />
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-[#8A8A8A] text-sm hover:text-konkan-gold transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-konkan-gold shrink-0" />
                <a href={`mailto:${email}`} className="text-[#8A8A8A] text-sm hover:text-konkan-gold transition-colors">{email}</a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-1 text-konkan-gold shrink-0" />
                <span className="text-[#8A8A8A] text-sm">
                  {s.business_hours_weekday || 'Mon-Sat: 9:00 AM - 8:00 PM'}<br />
                  {s.business_hours_sunday || 'Sun: 10:00 AM - 6:00 PM'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-konkan-sand/60 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} {t('app.name')}. {t('footer.rights_reserved')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-konkan-sand/60 text-xs">We Accept:</span>
            {/* Razorpay */}
            <span className="flex items-center justify-center" style={{ height: '28px', padding: '0 10px', backgroundColor: '#FFFFFF', borderRadius: '6px' }}>
              <svg width="80" height="20" viewBox="0 0 116 30" aria-label="Razorpay">
                <text x="0" y="22" fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fontWeight="bold" fill="#0A2540">Razorpay</text>
              </svg>
            </span>
            {/* UPI */}
            <span className="flex items-center justify-center" style={{ height: '28px', padding: '0 10px', backgroundColor: '#FFFFFF', borderRadius: '6px' }}>
              <Image src="/images/payments/upi.svg" alt="UPI" width={60} height={20} className="h-5 w-auto" unoptimized />
            </span>
            {/* Visa */}
            <span className="flex items-center justify-center" style={{ height: '28px', padding: '0 10px', backgroundColor: '#FFFFFF', borderRadius: '6px' }}>
              <Image src="/images/payments/visa.svg" alt="Visa" width={56} height={18} className="h-5 w-auto" unoptimized />
            </span>
            {/* Mastercard */}
            <span className="flex items-center justify-center" style={{ height: '28px', padding: '0 10px', backgroundColor: '#FFFFFF', borderRadius: '6px' }}>
              <Image src="/images/payments/mastercard.svg" alt="Mastercard" width={66} height={20} className="h-5 w-auto" unoptimized />
            </span>
            {/* RuPay */}
            <span className="flex items-center justify-center" style={{ height: '28px', padding: '0 10px', backgroundColor: '#FFFFFF', borderRadius: '6px' }}>
              <Image src="/images/payments/rupay.svg" alt="RuPay" width={64} height={20} className="h-5 w-auto" unoptimized />
            </span>
            {/* Net Banking */}
            <span className="flex items-center justify-center" style={{ height: '28px', padding: '0 10px', backgroundColor: '#FFFFFF', borderRadius: '6px' }}>
              <svg width="110" height="20" viewBox="0 0 132 30" aria-label="Net Banking">
                <g fill="none" stroke="#0A2540" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" transform="translate(1 6)">
                  <path d="M2 10l10-7 10 7" />
                  <path d="M4 11v8" />
                  <path d="M11 11v8" />
                  <path d="M18 11v8" />
                  <path d="M1 21h22" />
                  <path d="M6 21v-2" />
                  <path d="M16 21v-2" />
                </g>
                <text x="32" y="21" fontFamily="Arial, Helvetica, sans-serif" fontSize="14" fontWeight="bold" fill="#0A2540">Net Banking</text>
              </svg>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
            <Link href="/privacy" className="text-[#666] hover:text-konkan-gold text-xs transition-colors">{t('footer.privacy_policy')}</Link>
            <Link href="/terms" className="text-[#666] hover:text-konkan-gold text-xs transition-colors">{t('footer.terms_of_service')}</Link>
            <Link href="/shipping-policy" className="text-[#666] hover:text-konkan-gold text-xs transition-colors">{t('footer.shipping_policy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
