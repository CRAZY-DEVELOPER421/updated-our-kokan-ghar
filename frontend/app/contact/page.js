'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import api from '@/lib/api';

const FAQS = [
  {
    q: 'What areas do you deliver to?',
    a: 'We currently deliver across all major cities in India. Delivery to remote areas in the Konkan region may take 1-2 additional days. Free shipping is available on orders above ₹499.',
  },
  {
    q: 'How are fresh products like mangoes and seafood packaged?',
    a: 'Fresh produce is handpicked and packed in ventilated corrugated boxes with cushioning material. Seafood is flash-frozen and packed in insulated thermocol boxes with gel packs to maintain freshness during transit.',
  },
  {
    q: 'What is your return and refund policy?',
    a: 'We offer a 7-day easy return policy on all non-perishable items. For perishable goods like fresh produce and seafood, we offer replacement or refund if the items arrive damaged or spoiled — please share photos within 24 hours of delivery.',
  },
  {
    q: 'How do I track my order?',
    a: 'Once your order is dispatched, you will receive a tracking link via email and SMS. You can also track your order by visiting your account dashboard under "My Orders" or by contacting our support team.',
  },
  {
    q: 'Do you offer bulk orders or corporate gifting?',
    a: 'Yes! We offer special pricing for bulk orders and corporate gift hampers featuring premium Konkan products. Please reach out to us via the contact form or call us directly for a custom quote.',
  },
  {
    q: 'Are your products organic and authentic?',
    a: 'We source directly from trusted farmers and artisans across the Konkan region. Many of our products are organically grown, and we clearly label organic items. We guarantee the authenticity and freshness of every product we sell.',
  },
];

const SOCIAL_ICONS = {
  social_instagram: { label: 'Instagram', color: 'hover:text-pink-600' },
  social_facebook: { label: 'Facebook', color: 'hover:text-blue-600' },
  social_twitter: { label: 'Twitter', color: 'hover:text-sky-500' },
  social_youtube: { label: 'YouTube', color: 'hover:text-red-600' },
  social_whatsapp: { label: 'WhatsApp', color: 'hover:text-green-500' },
  social_linkedin: { label: 'LinkedIn', color: 'hover:text-blue-700' },
};

function SocialIcon({ type, className = 'w-5 h-5' }) {
  switch (type) {
    case 'social_instagram':
      return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>;
    case 'social_facebook':
      return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
    case 'social_twitter':
      return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
    case 'social_youtube':
      return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
    case 'social_whatsapp':
      return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>;
    case 'social_linkedin':
      return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
    default:
      return null;
  }
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Fetch settings from public API
  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => { const res = await api.get('/settings'); return res.data.data; },
    staleTime: 5 * 60 * 1000,
  });

  const s = settingsData?.settings || {};

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit number';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    else if (form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, ''),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      toast.success('Message sent! We\'ll get back to you shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setErrors({});
    } catch {
      toast.success('Message sent! We\'ll get back to you shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setErrors({});
    }
    setSending(false);
  };

  const phone1 = s.phone_primary || '+919876543210';
  const phone2 = s.phone_secondary || '';
  const email1 = s.email_primary || 'hello@kokanghar.in';
  const email2 = s.email_secondary || '';
  const addr1 = s.address_line1 || '';
  const addr2 = s.address_line2 || '';
  const addrCity = s.address_city || '';
  const addrCountry = s.address_country || '';

  const socialKeys = ['social_instagram', 'social_facebook', 'social_twitter', 'social_youtube', 'social_whatsapp', 'social_linkedin'];
  const activeSocials = socialKeys.filter(k => s[k]);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-r from-konkan-green-dark via-konkan-green-primary to-konkan-green-secondary py-10 md:py-14">
        <div className="container-custom">
          <Breadcrumb items={[{ label: 'Contact Us' }]} light />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">
            Get in Touch
          </h1>
          <p className="text-konkan-green-pale/80 mt-2 max-w-2xl">
            Have a question, feedback, or just want to say namaste? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="container-custom -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Call Us Card */}
          <div className="bg-white rounded-xl card p-5 flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-konkan-green-primary/10 flex items-center justify-center text-konkan-green-primary shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-1">Call Us</h3>
              <a href={`tel:${phone1.replace(/\D/g, '')}`} className="block text-sm text-konkan-green-primary font-medium hover:underline">{phone1}</a>
              {phone2 && <a href={`tel:${phone2.replace(/\D/g, '')}`} className="block text-sm text-konkan-green-primary font-medium hover:underline mt-0.5">{phone2}</a>}
              <p className="text-xs text-konkan-text-secondary mt-1">Mon&ndash;Sat, 9 AM &ndash; 7 PM</p>
            </div>
          </div>

          {/* Email Us Card */}
          <div className="bg-white rounded-xl card p-5 flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-konkan-green-primary/10 flex items-center justify-center text-konkan-green-primary shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-1">Email Us</h3>
              <a href={`mailto:${email1}`} className="block text-sm text-konkan-green-primary font-medium hover:underline">{email1}</a>
              {email2 && <a href={`mailto:${email2}`} className="block text-sm text-konkan-green-primary font-medium hover:underline mt-0.5">{email2}</a>}
              <p className="text-xs text-konkan-text-secondary mt-1">We reply within 24 hours</p>
            </div>
          </div>

          {/* Visit Us Card */}
          <div className="bg-white rounded-xl card p-5 flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-konkan-green-primary/10 flex items-center justify-center text-konkan-green-primary shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-1">Visit Us</h3>
              {addr1 && <p className="text-sm text-konkan-text-secondary">{addr1}</p>}
              {addr2 && <p className="text-sm text-konkan-text-secondary">{addr2}</p>}
              <p className="text-sm text-konkan-text-secondary">{addrCity}{addrCountry ? `, ${addrCountry}` : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form + Map Section */}
      <div className="container-custom py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-3" id="contact-form">
            <h2 className="font-display text-2xl font-bold text-konkan-text-primary mb-1">Send us a Message</h2>
            <p className="text-sm text-konkan-text-secondary mb-6">
              Fill in the form below and our team will get back to you within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                  placeholder="John Doe"
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={errors.email}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  error={errors.phone}
                  placeholder="9876543210"
                />
                <Input
                  label="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  error={errors.subject}
                  placeholder="How can we help?"
                  required
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-konkan-text-primary mb-1.5">
                  Your Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us more about your query..."
                  rows={5}
                  className={`input-field resize-none ${errors.message ? 'border-konkan-error focus:ring-konkan-error/30' : ''}`}
                  required
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-konkan-error">{errors.message}</p>
                )}
              </div>
              <Button type="submit" size="lg" loading={sending}>
                Send Message
              </Button>
            </form>
          </div>

          {/* Map / Info Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-konkan-cream/50 rounded-xl p-5">
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">
                {s.map_location_name || 'Our Location'}
              </h3>
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-konkan-sand/50">
                <iframe
                  src={s.map_embed_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3847.123!2d73.816!3d15.594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMapusa%2C+Goa!5e0!3m2!1sen!2sin!4v1'}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '200px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={s.map_location_name || 'Kokan Ghar Location'}
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-konkan-cream/50 rounded-xl p-5">
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-2">Business Hours</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-konkan-text-secondary">Monday – Saturday</span>
                  <span className="font-medium text-konkan-text-primary">{s.business_hours_weekday || '9:00 AM – 7:00 PM'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-konkan-text-secondary">Sunday</span>
                  <span className="font-medium text-konkan-text-primary">{s.business_hours_sunday || '10:00 AM – 2:00 PM'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-konkan-text-secondary">Public Holidays</span>
                  <span className="font-medium text-konkan-text-primary">{s.business_hours_holiday || 'Closed'}</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-konkan-cream/50 rounded-xl p-5">
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">Follow Us</h3>
              {activeSocials.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3">
                  {activeSocials.map((key) => {
                    const meta = SOCIAL_ICONS[key];
                    return (
                      <a
                        key={key}
                        href={s[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white border border-konkan-sand flex items-center justify-center text-konkan-text-secondary hover:border-konkan-green-primary hover:bg-konkan-green-primary/5 hover:text-konkan-green-primary transition-all"
                        aria-label={meta?.label || key}
                        title={meta?.label || key}
                      >
                        <SocialIcon type={key} className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-konkan-text-secondary">Follow us on social media!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white border-t border-konkan-sand/50">
        <div className="container-custom py-10 md:py-14">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-konkan-text-secondary mt-2">
              Quick answers to common questions. Can&apos;t find what you&apos;re looking for?{' '}
              <a href="#contact-form" className="text-konkan-green-primary hover:underline font-medium">
                Contact us
              </a>
              .
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="border border-konkan-sand/50 rounded-xl overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-konkan-cream/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-konkan-text-primary pr-4">{faq.q}</span>
                    <svg
                      className={`w-4 h-4 text-konkan-text-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-out overflow-hidden ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-5 pb-4 text-sm text-konkan-text-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
