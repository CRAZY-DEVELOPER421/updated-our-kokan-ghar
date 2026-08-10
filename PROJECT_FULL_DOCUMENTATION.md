# 🌴 KONKAN BAZAAR — COMPLETE PROJECT DOCUMENTATION
### (Jo kuch bhi is project me implement hua hai — sab ek file me)

**Project ka naam:** Konkan Bazaar (Storefront pe "Kokan Ghar")
**Kya hai:** Konkan region (Maharashtra, Goa, Karnataka) ke authentic products — Alphonso mango, spices, cashew, seafood, snacks — ki online e-commerce marketplace.
**Scale:** 200+ products, 10+ categories, 3 apps ek saath (monorepo).

---

## 🏗️ 1. ARCHITECTURE (Project ka Structure)

Ye ek **monorepo** hai — matlab teen alag apps ek hi folder me, sab ek hi `.env` file share karte hain:

```
konkan-bazaar/
├── frontend/    → Storefront (Customer wali website)  → PORT 3000
├── admin/       → Admin Panel (Store wale ke liye)    → PORT 3001
├── backend/     → REST API (Server)                   → PORT 5000
├── database/    → MySQL schema + seed files
└── docs/        → Guides
```

- **Customer Storefront** → `frontend/` (Next.js)
- **Admin Panel** → `admin/` (Next.js)
- **Backend API** → `backend/` (Node.js + Express)
- **Database** → MySQL 8 (26+ tables)

---

## 🛠️ 2. TECH STACK (Kya use hua hai)

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 3 |
| **Admin Panel** | Next.js 16 (App Router), React 19, Tailwind CSS 3 |
| **Backend** | Node.js + Express 4, MySQL2 (parameterized raw queries, koi ORM nahi) |
| **Database** | MySQL 8+ (utf8mb4, 26+ tables) |
| **State Management** | Zustand (cart, wishlist, auth) + TanStack React Query (data fetching/caching) |
| **Auth** | JWT (access 15 min + refresh 7 days httpOnly cookie) + Google/Facebook OAuth |
| **Payments** | Razorpay (signature verification ke saath) + COD |
| **API Docs** | Swagger UI (`/api-docs`) |
| **Email** | Nodemailer (SMTP) — OTP, welcome emails |
| **UI/Animations** | shadcn-style components, Framer Motion, Swiper carousel, Recharts (analytics charts) |
| **Security** | Helmet, CORS whitelist, Rate limiting, bcryptjs (12 rounds), express-validator, parameterized SQL |
| **i18n (Languages)** | 5 languages — English, Hindi, Marathi, Gujarati, Kannada |
| **SEO** | next-sitemap, robots.txt, Open Graph tags, metadata |

---

## 🖥️ 3. FRONTEND (Storefront) — POORA DETAIL

### 3.1 Homepage (14+ sections)
1. **Hero Slider** — banner slideshow (desktop, Swiper)
2. **Mobile Hero** — alag mobile version
3. **Shop by Category** — category grid
4. **Trust Badges** — trust signals (free shipping, quality, etc.)
5. **Flash Sale** — countdown timer ke saath (live deals)
6. **Deals Under ₹999** — budget section
7. **Bestsellers** — sabse zyada bikne wale products
8. **All Under ₹499** — budget section
9. **Promo Banners** — promotional offers
10. **New Arrivals** — naye products
11. **Discover Products For You** — personalized picks
12. **Testimonials** — customer reviews/social proof
13. **Blog Preview** — latest blog posts
14. **Newsletter** — email subscribe
15. **Help/Contact** — contact + mobile bottom nav

> 💡 **Mobile-first design:** Har section ka alag mobile component hai (MobileHero, MobileFlashSale, etc.) — website poori tarah responsive hai.

### 3.2 Product Pages
- **/products** — Product listing with filters (category, price range, rating), sorting (price, rating, newest), pagination
- **/products/[slug]** — Product detail page:
  - Multiple images with zoom (ZoomImage)
  - Variants selection (weight, size)
  - Price + MRP + discount percent
  - Stock status
  - Flash sale price
  - Reviews with ratings + helpful votes
  - Share button
  - Quick View modal (product carousel se)
- **/categories/[slug]** — Category-wise products

### 3.3 Search
- **/search?q=** — Full-text search
- Autocomplete suggestions (product + category names)
- Trending searches (7 din ke popular searches)
- Infinite scroll
- Filters: category, price, rating, sort

### 3.4 Cart & Checkout
- **/cart** — Shopping cart + Cart Drawer (sidebar me cart)
- Coupon code apply (cart pe discount)
- **/checkout** — 3-step checkout:
  1. Address (new + saved addresses)
  2. Order Summary
  3. Payment — **Razorpay** (UPI, cards, netbanking) ya **COD**
- **/order-success** — order confirm hone ke baad wala page

### 3.5 User Account (Login ke baad)
- **/login, /signup** — email/password + Google/Facebook login
- **/account** — Dashboard
- **/account/profile** — profile edit
- **/account/orders** — order history
- **/account/orders/[id]** — order detail + **tracking timeline** (confirmed → shipped → delivered)
- **/account/addresses** — address manage (home/work/other, default)
- **/account/wishlist** — wishlist
- **/account/loyalty** — loyalty points + tier progress
- **/account/notifications** — in-app notifications
- **/account/buy-again** — phir se order karo
- **/account/payment-methods** — saved payment methods
- **/account/settings** — account settings

### 3.6 Content & Service Pages
- **/blog + /blog/[slug]** — blog list + detail (related posts ke saath)
- **/videos** — video gallery
- **/coupons** — coupon offers
- **/offers** — bank offers + combo deals
- **/about, /contact, /faq, /privacy, /terms, /return-policy, /shipping-policy** — static pages
- **Language Switcher** — 5 languages me website change karo

### 3.7 Performance & UX
- Dynamic imports + Suspense + skeleton loading (har section ke liye shimmer)
- `next/image` lazy loading, `next/font` preload
- Page transitions (Framer Motion)
- Back to top button
- Toast notifications (react-hot-toast)
- SEO: sitemap.xml, robots.txt, Open Graph, Twitter cards

---

## ⚙️ 4. BACKEND (REST API) — POORA DETAIL

**23 controllers + 22 route groups.** Sab queries parameterized (SQL injection safe), no ORM.

### 4.1 Auth (`/api/auth`)
- Register, Login, Logout
- Refresh token (JWT access 15 min + refresh 7 days httpOnly cookie)
- Forgot / Reset password (OTP via email)
- Email verification (verify token + resend)
- **Google OAuth** + **Facebook OAuth** login (PKCE flow, no NextAuth)
- Rate limiting on auth routes (5 req / 15 min / IP)

### 4.2 Products (`/api/products`)
- Full CRUD (admin), pagination, filters, sort
- Featured, Bestsellers, Seasonal, New Arrivals, Related products
- Product detail with images, variants, tags, flash sale, bundle data

### 4.3 Categories (`/api/categories`)
- CRUD, parent-child (nested categories), product count ke saath

### 4.4 Cart (`/api/cart`)
- Add/update/remove items, variant support
- Coupon apply/remove (server-side validation)
- Cart persistence (MySQL me save hota hai)

### 4.5 Wishlist (`/api/wishlist`)
- Add/remove/list wishlist items

### 4.6 Orders (`/api/orders`)
- Place order (online + COD)
- Order history, order detail
- **Order tracking timeline** (order_tracking table)
- Status flow: pending → confirmed → processing → shipped → out_for_delivery → delivered
- Returns: return_requested → returned → refund_initiated → refunded
- Buy-again support

### 4.7 Payment (`/api/payment`) — Razorpay
- Create Razorpay order (INR)
- **Verify payment** (signature verification — server-side secure)
- COD confirm
- Payment failed → order status + notification
- Payment success → order confirmed + loyalty points + notification

### 4.8 Coupons (`/api/coupons`)
- Types: **percentage, flat, free_shipping, bogo**
- Min order amount, max discount, usage limit, valid dates
- Coupon usage tracking (coupon_usage table)

### 4.9 Flash Sales (`/api/flash-sales`)
- Product pe time-limited sale price
- Start/end time, quantity limit, sold count

### 4.10 Bank Offers (`/api/bank-offers`)
- Credit card / debit card / UPI / EMI / netbanking offers
- Bank name, logo, min order, max discount, terms URL

### 4.11 Bundles / Combo Deals (`/api/bundles`)
- Combo packs (multiple products ek saath, discounted price)
- bundle_products mapping, savings percent calculation

### 4.12 Reviews (`/api/reviews`)
- Product reviews with rating (1-5)
- **Helpful votes** (review_votes table — ek user ek baar vote kar sakta hai)
- Verified purchase badge
- Rating aggregation (average_rating, review_count auto-update)

### 4.13 Search (`/api/search`)
- Full-text search (LIKE on name, description, ingredients, brand)
- Autocomplete suggestions
- Trending searches (search_logs se 7 din ka data)
- Search logs recording (analytics ke liye)

### 4.14 Loyalty & Referrals (`/api/users/loyalty`)
- **10 points per ₹1** spent
- **Tiers:** Bronze (0) → Silver (1000) → Gold (5000) → Platinum (10000)
- Points redemption (100 points = ₹10 discount)
- Referral system (reward ₹50 per referral — settings me)
- Points history (earned/redeemed/expired)

### 4.15 Notifications (`/api/notifications`)
- In-app notifications — order confirmed, shipped, delivered, payment received/failed
- Read/unread status

### 4.16 Banners (`/api/banners`)
- Hero, mid, sidebar positions
- Desktop + mobile image support
- Date validity

### 4.17 CMS (`/api/cms`)
- **Blogs** — create/edit/delete, categories, featured, SEO fields, related posts, view count
- **Videos** — video categories (short/long), like & share counts, view count, related videos
- **Team Members** — bio, social links, skills, experience, reorder (drag)
- **Media Library** — uploaded files ka record

### 4.18 Customer Service Pages (`/api/customer-service`)
- Terms, Shipping Policy, Privacy, FAQ, Return Policy — sab admin se editable
- Text + FAQ (accordion) page types

### 4.19 Settings (`/api/settings`)
- Site name, contact info, free shipping minimum, delivery charge, tax rate
- Loyalty rates, referral reward, social links, store hours, address, spin wheel toggle

### 4.20 Analytics (`/api/analytics`) — Admin
- Dashboard stats: total users, new users (7 din), products, orders, pending orders, total revenue, today's revenue
- Orders by status
- Monthly revenue (12 months)
- Recent orders (10)
- Low stock products (< 10 stock)
- Top 20 products (by sales)
- Category performance (units sold, revenue)
- Search terms (30 din ke top searches)

### 4.21 Admin (`/api/admin`)
- Product management (create/update/delete, combo support)
- Category management
- Order management (status update → user ko notification jaati hai)
- Coupon, Banner, Flash Sale, Bank Offer, Bundle management
- User management (activate/suspend/delete)

### 4.22 Contact & Subscribers
- Contact form submit
- Newsletter subscribe

### 4.23 Uploads (`/api/upload`)
- Multer file upload (images)

### 🔐 Security Features
- Helmet (security headers)
- CORS whitelist (sirf allowed origins)
- Rate limiting (auth 5/15min, general API 1000 req)
- bcryptjs 12 rounds password hashing
- JWT access + refresh token architecture
- 100% parameterized SQL queries
- express-validator on all POST/PUT endpoints
- Admin password verification server-side (browser me kabhi nahi)

---

## 🗄️ 5. DATABASE — POORA DETAIL (26+ TABLES)

| # | Table | Kaam |
|---|---|---|
| 1 | `users` | Customers/admin/sellers, password, OAuth info, role, verify status |
| 2 | `addresses` | Delivery addresses (home/work/other, default flag) |
| 3 | `categories` | Category tree (parent-child), SEO meta |
| 4 | `products` | 200+ products — price, MRP, discount (auto), stock, brand, region, organic, ingredients, ratings |
| 5 | `product_images` | Multiple images per product, primary flag |
| 6 | `product_variants` | Size/weight variants with price modifier + stock |
| 7 | `product_tags` | Product tags |
| 8 | `orders` | Order info — status (11 statuses), payment, coupon discount, delivery dates |
| 9 | `order_items` | Order ke products (snapshot: name, image, price, qty) |
| 10 | `order_tracking` | Tracking timeline history |
| 11 | `cart` | User cart + coupon |
| 12 | `cart_items` | Cart products (variant + qty) |
| 13 | `wishlist` | Wishlist (unique per user+product) |
| 14 | `coupons` | Coupon types, limits, validity |
| 15 | `coupon_usage` | Kaunse user ne kaunsa coupon use kiya |
| 16 | `reviews` | Reviews with rating, images, verified purchase, helpful count |
| 17 | `review_votes` | Helpful vote (unique per user+review) |
| 18 | `notifications` | In-app notifications |
| 19 | `banners` | Hero/mid/sidebar banners |
| 20 | `flash_sales` | Time-limited sales |
| 21 | `bundles` | Combo deals |
| 22 | `bundle_products` | Combo ke member products |
| 23 | `loyalty_points` | Points transaction history |
| 24 | `user_loyalty` | User points + tier |
| 25 | `referrals` | Referral tracking + reward |
| 26 | `search_logs` | Search queries (analytics ke liye) |
| 27 | `site_settings` | Key-value site settings |
| 28 | `subscribers` | Newsletter subscribers |
| 29 | `bank_offers` | Bank offers |
| 30+ | `team_members`, `blog_categories`, `blogs`, `video_categories`, `videos`, `media_library`, `customer_service_pages` | CMS tables |

**Highlights:**
- `products` me **FULLTEXT index** — fast search ke liye
- **Generated column** — discount_percent khud calculate hota hai (MRP vs price se)
- Foreign keys + cascade deletes — data consistency
- utf8mb4 — Hindi/Marathi/Gujarati/Kannada fonts support

---

## 🛡️ 6. ADMIN PANEL — POORA DETAIL (Kya-kya kar sakte hain)

Admin panel ka login: `ADMIN_PANEL_PASSWORD` env file me (backend verify karta hai).

### 6.1 📊 Analytics Dashboard
- Live stats: total users, naye users, products, orders, pending orders
- Total revenue + aaj ki revenue
- Orders by status chart
- Monthly revenue chart (12 months, Recharts)
- Recent orders list
- Low stock alerts (stock < 10)

### 6.2 🛍️ Products
- List with search, filter by category, status (active/inactive), **image status** (uploaded/pending)
- Create product — price, MRP, stock, SKU, brand, weight, ingredients, nutritional info, SEO fields
- **Combo/Bundle creation** — multiple products select karke combo pack banao (discount price ke saath)
- Edit — images, variants, tags, flash sale link
- Delete (combo products ka linked bundle bhi clean hota hai)

### 6.3 📁 Categories
- Create/Edit/Delete categories, parent category (tree), image, SEO meta, sort order

### 6.4 📦 Orders
- All orders list, filter by status
- Order detail — items, address, payment info, tracking timeline
- **Status update** → user ko automatic notification jaati hai (confirmed/shipped/out for delivery/delivered)

### 6.5 👥 Users
- All customers list, activate/suspend, delete

### 6.6 🎟️ Coupons
- Create coupons — percentage/flat/free shipping/BOGO
- Min order, max discount, usage limit, validity dates

### 6.7 🧺 Bundles / Combo
- Create/edit combo deals — bundle price, original price, member products, validity
- Savings % auto-calculated

### 6.8 ⚡ Flash Sales
- Product select karo, sale price, quantity limit, start/end time

### 6.9 🏦 Bank Offers
- Bank name, logo, offer title/description, discount type (card/UPI/EMI), min order, max discount

### 6.10 📝 Blogs
- Write/edit/delete blogs — content, excerpt, hero image, category, tags, featured, SEO (meta title, OG image, canonical)
- Blog categories manage

### 6.11 🎬 Videos
- Add videos — URL, thumbnail, category, duration, featured, publish/schedule

### 6.12 👨‍👩‍👧 Team
- Team members — designation, bio, social links, skills, experience, achievements
- **Reorder** (display order)

### 6.13 📄 Customer Service Pages
- Terms, Shipping, Privacy, FAQ, Return Policy — **sab content admin se edit hota hai** (bina code change kiye)

### 6.14 ⚙️ Settings
- Site name, contact email/phone, social links
- Free shipping minimum amount, delivery charge, tax rate
- Loyalty points per rupee, redeem rate, referral reward
- Store hours, address

---

## 🔗 7. INTEGRATIONS (Bahari Services)

| Service | Kya ke liye | Status |
|---|---|---|
| **Razorpay** | Payment gateway (UPI/cards/netbanking) — order create + signature verify | ✅ Integrated |
| **Google OAuth** | Google se login | ✅ Integrated |
| **Facebook OAuth** | Facebook se login | ✅ Integrated |
| **Nodemailer (SMTP)** | OTP emails, welcome, verify emails | ✅ Integrated |
| **Swagger UI** | API documentation (`/api-docs`) | ✅ Integrated |
| **MySQL** | Database | ✅ Integrated |

---

## ✅ 8. JO IMPLEMENT HO CHUKA HAI — QUICK SUMMARY

✅ Full e-commerce storefront (Next.js 16, mobile-first, 5 languages)
✅ Admin panel with analytics + full management
✅ REST API (23 modules) with Swagger docs
✅ JWT auth + Google/Facebook login + email verification + OTP password reset
✅ Razorpay payments (secure verify) + COD
✅ Cart, wishlist, coupons (4 types), combo bundles, flash sales, bank offers
✅ Order tracking timeline + notifications
✅ Reviews with helpful votes + verified purchase
✅ Loyalty points + 4 tiers + referrals
✅ Full-text search + autocomplete + trending + infinite scroll
✅ CMS — blogs, videos, team, media library
✅ Customer service pages (terms/FAQ/etc.) — admin editable
✅ Site settings — admin editable
✅ Analytics dashboard (revenue, orders, categories, search terms)
✅ 200+ products seeded, 26+ database tables
✅ Security: helmet, rate limiting, validation, parameterized queries
✅ SEO — sitemap, robots, Open Graph

---

## 🔜 9. FUTURE SCOPE (Aage kya kiya ja sakta hai)

- Order tracking me live courier API (Shiprocket/Delhivery) integration
- WhatsApp/email order notifications
- Multi-vendor support (seller accounts — role already hai)
- Reviews ke liye image upload
- Advanced analytics (conversion, cart abandonment)
- Payment refund flow automation
- Razorpay subscriptions / EMI support
- Production deployment (Railway/AWS/Vercel)
