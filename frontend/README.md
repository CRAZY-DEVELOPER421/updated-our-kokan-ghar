# Kokan Ghar — Frontend

Next.js 14 App Router e-commerce frontend for Kokan Ghar.

## Setup

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev    # → http://localhost:3000
```

## Architecture

- **App Router** — All pages in `app/` directory
- **Server Components** by default, `'use client'` only when needed
- **Dynamic imports** with Suspense + skeleton fallbacks for below-fold components
- **React Query** for all data fetching + caching
- **Zustand** for client state (auth, cart, wishlist)

## Pages

### Public
- `/` — Homepage with 14 sections
- `/products` — Product listing with filters + pagination
- `/products/[slug]` — Product detail with reviews
- `/categories/[slug]` — Category products
- `/search?q=` — Search with infinite scroll + autocomplete
- `/cart` — Shopping cart
- `/checkout` — 3-step checkout (address → summary → payment)
- `/about`, `/contact`, `/faq`, `/offers`, `/blog`

### Auth
- `/login`, `/signup`

### Account (requires login)
- `/account` — Dashboard
- `/account/profile`, `/account/orders`, `/account/addresses`
- `/account/wishlist`, `/account/loyalty`, `/account/notifications`

### Admin (requires admin role)
- `/admin` — Dashboard, Products, Orders, Users, Coupons, Analytics

## Design System

- Primary: #2D6A4F (deep forest green)
- Accent: #E87722 (saffron)
- Fonts: Playfair Display (headings), Inter (body)
- Fully responsive: mobile-first Tailwind

## Performance

- `next/image` with lazy loading + priority for above-fold
- `next/font` with preload
- Dynamic imports for below-fold components
- Skeleton shimmer loading states everywhere
