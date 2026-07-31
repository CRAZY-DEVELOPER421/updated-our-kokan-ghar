'use client';

import Image from 'next/image';
import Link from 'next/link';

const shopLinks = [
  { label: 'All Products', href: '/products' },
  { label: 'Seafood', href: '/categories/coastal-seafood' },
  { label: 'Pickles', href: '/categories/pickles-chutneys' },
  { label: 'Dry Fish', href: '/categories/dry-fish' },
  { label: 'Masalas', href: '/categories/masalas-spices' },
  { label: 'Snacks', href: '/categories/snacks-savories' },
  { label: 'Oils & Coconut', href: '/categories/oils-coconut' },
  { label: 'Beverages', href: '/categories/beverages' },
];

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Our Story', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Careers', href: '/careers' },
];

const policyLinks = [
  { label: 'Shipping Policy', href: '/shipping-policy' },
  { label: 'Return Policy', href: '/return-policy' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
];

export default function MobileFooter() {
  return (
    <footer
      style={{
        backgroundColor: '#3D2B1F',
        backgroundImage: 'none',
        padding: '32px 16px 24px',
      }}
    >
      {/* ── 3-Column Link Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        {/* Column 1: Shop */}
        <div>
          <h4
            className="font-bold"
            style={{
              fontSize: '13px',
              color: '#FFFFFF',
              marginBottom: '10px',
            }}
          >
            Shop
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {shopLinks.map((link, idx) => (
              <li key={idx} style={{ lineHeight: '2.2' }}>
                <Link
                  href={link.href}
                  className="hover:opacity-100 transition-opacity no-underline"
                  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Company */}
        <div>
          <h4
            className="font-bold"
            style={{
              fontSize: '13px',
              color: '#FFFFFF',
              marginBottom: '10px',
            }}
          >
            Company
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {companyLinks.map((link, idx) => (
              <li key={idx} style={{ lineHeight: '2.2' }}>
                <Link
                  href={link.href}
                  className="hover:opacity-100 transition-opacity no-underline"
                  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Policies */}
        <div>
          <h4
            className="font-bold"
            style={{
              fontSize: '13px',
              color: '#FFFFFF',
              marginBottom: '10px',
            }}
          >
            Policies
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {policyLinks.map((link, idx) => (
              <li key={idx} style={{ lineHeight: '2.2' }}>
                <Link
                  href={link.href}
                  className="hover:opacity-100 transition-opacity no-underline"
                  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Brand Block ── */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Logo icon: green circle with white palm/hut glyph */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#3A7D5C',
            }}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <span
            className="font-bold"
            style={{
              fontSize: '16px',
              color: '#FFFFFF',
            }}
          >
            Konkan Ghar
          </span>
        </div>
        <p
          className="mt-1.5"
          style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
        >
          Bringing the authentic taste of Konkan straight to your home.
        </p>
      </div>

      {/* ── Payment Icons (official brand logos) ── */}
      <div
        className="flex flex-wrap items-center gap-2"
        style={{ marginTop: '16px' }}
      >
        {/* UPI */}
        <span
          className="flex items-center justify-center"
          style={{
            height: '26px',
            padding: '0 8px',
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
          }}
        >
          <Image
            src="/images/payments/upi.svg"
            alt="UPI"
            width={24}
            height={14}
            className="h-3.5 w-auto"
            unoptimized
          />
        </span>

        {/* Visa */}
        <span
          className="flex items-center justify-center"
          style={{
            height: '26px',
            padding: '0 8px',
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
          }}
        >
          <Image
            src="/images/payments/visa.svg"
            alt="Visa"
            width={28}
            height={14}
            className="h-3.5 w-auto"
            unoptimized
          />
        </span>

        {/* Mastercard */}
        <span
          className="flex items-center justify-center"
          style={{
            height: '26px',
            padding: '0 8px',
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
          }}
        >
          <Image
            src="/images/payments/mastercard.svg"
            alt="Mastercard"
            width={28}
            height={14}
            className="h-3.5 w-auto"
            unoptimized
          />
        </span>

        {/* RuPay */}
        <span
          className="flex items-center justify-center"
          style={{
            height: '26px',
            padding: '0 8px',
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
          }}
        >
          <Image
            src="/images/payments/rupay.svg"
            alt="RuPay"
            width={28}
            height={14}
            className="h-3.5 w-auto"
            unoptimized
          />
        </span>
      </div>

      {/* ── Copyright ── */}
      <p
        className="text-center"
        style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.5)',
          marginTop: '20px',
        }}
      >
        &copy; 2024 Konkan Ghar. All Rights Reserved.
      </p>


    </footer>
  );
}
