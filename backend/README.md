# Konkan Bazaar — Backend API

Node.js + Express REST API for Konkan Bazaar e-commerce platform.

## Setup

```bash
cd backend
cp .env.example .env
# Fill in: DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, RAZORPAY_KEY_ID, etc.
npm install
npm run dev    # → http://localhost:5000
```

## Environment Variables

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL user |
| `DB_PASS` | MySQL password |
| `DB_NAME` | Database name (konkan_bazaar) |
| `JWT_SECRET` | JWT signing secret |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `SMTP_HOST` | Mail server |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |
| `NODE_ENV` | development/production |

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Products
- `GET /api/products` (pagination, filters, sort)
- `GET /api/products/featured`
- `GET /api/products/bestsellers`
- `GET /api/products/seasonal`
- `GET /api/products/:slug`

### Cart, Orders, Payment, Users, Admin
Full REST API for all e-commerce operations.

## Security

- Helmet, CORS whitelist, Rate limiting
- bcryptjs (12 rounds) for passwords
- JWT access (15min) + refresh (7d httpOnly cookie)
- Parameterized SQL queries only
- express-validator on all POST/PUT endpoints
