/**
 * Mobile-only design tokens (Section 1 of spec).
 * These are JS constants — no global CSS or Tailwind config changes.
 * Import in mobile components to use directly via Tailwind arbitrary values or inline styles.
 */

// ── Colors ──
export const colors = {
  // Primary Brand Green
  brandGreenDark: '#1B3B2F',
  brandGreen: '#2D5F4C',
  brandGreenLight: '#E8F0EC',
  brandGreenAccent: '#3A7D5C',

  // Orange/CTA Accent
  accentOrange: '#F5821F',
  accentOrangeHover: '#E07216',

  // Discount/Sale Badges
  badgeRed: '#E53935',
  badgeOrange: '#F5821F',

  // Neutrals
  textDark: '#1A1A1A',
  textBody: '#4A4A4A',
  textMuted: '#8A8A8A',
  bgWhite: '#FFFFFF',
  bgOffWhite: '#FAFAF8',
  borderLight: '#E5E5E5',

  // Ratings
  starGold: '#FFB800',
};

// ── Typography ──
export const typography = {
  fontHeading: "'Poppins', sans-serif",
  fontBody: "'Inter', sans-serif",

  fontSize: {
    hero: '26px',       // hero headline
    h1: '20px',         // section titles
    h2: '16px',         // card titles, subsection
    body: '14px',       // paragraph / description
    small: '12px',      // meta, ratings count
    price: '15px',      // price (bold)
  },

  fontWeight: {
    heading: 700,
    subheading: 600,
    body: 400,
    price: 700,
  },
};

// ── Spacing (4px base scale) ──
export const spacing = {
  sectionVertical: '32px 16px', // top/bottom 32px, sides 16px
  cardGap: '12px',
  containerPadding: '16px',
};

// ── Border Radius ──
export const borderRadius = {
  card: '12px',
  button: '8px',
  badgePill: '999px',
  productImageTop: '10px',
  badge: '6px',
};

// ── Shadows ──
export const shadows = {
  card: '0 2px 8px rgba(0,0,0,0.06)',
  stickyHeader: '0 2px 6px rgba(0,0,0,0.08)',
};

// ── Breakpoints ──
export const breakpoints = {
  mobile: 'max-width: 1023px',  // lg breakpoint
  desktop: 'min-width: 1024px', // lg+ breakpoint
};

// ── Helper: Tailwind arbitrary value helpers ──
// Use these like: className={`bg-[${colors.brandGreenDark}]`}

// ── Section header pattern (reusable) ──
export const sectionHeader = {
  padding: '24px 16px 12px',
  titleSize: typography.fontSize.h1,
  titleWeight: typography.fontWeight.heading,
  titleColor: colors.textDark,
  viewAllSize: '13px',
  viewAllWeight: 600,
  viewAllColor: colors.brandGreen,
};
