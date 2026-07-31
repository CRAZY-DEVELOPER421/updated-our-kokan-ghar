# updated-our-kokan-ghar

# 🌴 Konkan Bazaar — Authentic Konkan Products Online

An Amazon-style e-commerce marketplace exclusively for authentic Konkan region products from the Konkan coast of Maharashtra, Goa, and Karnataka.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS 3 |
| **Backend** | Node.js + Express, MySQL2 (raw queries) |
| **Database** | MySQL 8+ |
| **State** | Zustand, React Query |
| **Payment** | Razorpay |
| **Auth** | JWT (access 15min + refresh 7d httpOnly cookie) |

## Project Structure

```
konkan-bazaar/
├── frontend/     ← Next.js 14 App Router (PORT 3000)
├── backend/      ← Node.js + Express REST API (PORT 5000)
└── database/     ← MySQL schema + seed files
```

## Quick Start

### Database
```bash
mysql -u root -p -e "CREATE DATABASE konkan_bazaar"
mysql -u root -p konkan_bazaar < database/schema.sql
mysql -u root -p konkan_bazaar < database/seed.sql
```

### Backend
```bash
cd backend && cp .env.example .env
# Edit .env with your credentials
npm install && npm run dev
```

### Frontend
```bash
cd frontend && cp .env.local.example .env.local
npm install && npm run dev
```

## Features

- 🥭 200+ Konkan products across 10 categories
- 🔐 JWT auth with refresh tokens
- 🛒 Cart, wishlist, checkout with Razorpay
- ⭐ Product reviews with helpful voting
- 📦 Order tracking with timeline
- 💰 Loyalty points with tier system
- 🎟️ Coupon system with validation
- 🔍 Full-text search with autocomplete
- 📱 Fully responsive design
- ⚡ Infinite scroll with skeleton loading
- 🎨 Konkan-themed design system
