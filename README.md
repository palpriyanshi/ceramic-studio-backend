# Backend — MERN WD-14

Express REST API built with Node.js, MongoDB, Redis, and Cloudinary.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose |
| Cache | Redis |
| Auth | JWT + bcrypt |
| File Upload | Multer + Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Payment | Razorpay |
| Validation | Zod |
| Dev Server | Nodemon |

---

## Project Structure

```
backend/
├── index.js                        # Entry point
├── src/
│   └── app.js                      # Express app, middleware, route mounting
├── config/
│   ├── db.config.js                # MongoDB connection
│   ├── cloudinary.config.js        # Cloudinary SDK init
│   ├── multer.config.js            # Multer disk storage
│   ├── nodemailer.config.js        # SMTP transporter + sendWelcomeEmail()
│   ├── redis.config.js             # Redis client (lazy singleton)
│   └── rateLimit.config.js         # express-rate-limit config
├── controllers/
│   ├── auth/
│   │   ├── register.controller.js  # POST /api/v1/auth/register
│   │   └── login.controller.js     # POST /api/v1/auth/login
│   ├── product/
│   │   └── product.controller.js   # GET /api/v1/products/*
│   └── user/                       # (planned)
├── routes/
│   ├── auth.routes.js
│   ├── product.route.js
│   ├── users.route.js              # (planned)
│   └── order.route.js              # (planned)
├── models/
│   ├── user.model.js
│   ├── product.model.js
│   └── order.model.js              # (planned)
├── middlewares/
│   ├── cache.middleware.js         # Redis cache layer
│   ├── verifyToken.middle.js       # JWT auth guard
│   ├── error.middleware.js         # Global error handler
│   └── multer.middleware.js        # File upload middleware
├── validators/
│   ├── auth.validator.js           # Zod schemas for auth
│   └── product.validator.js        # Zod schemas for products
├── services/
│   └── payment.service.js          # Razorpay integration
├── utils/
│   ├── asyncHandler.utils.js       # Wraps async controllers
│   ├── cloudinary.utils.js         # Upload helper
│   ├── email.utils.js              # Generic sendEmail()
│   ├── errorHandler.utils.js       # ApiError class
│   └── productSeeder.js            # Seeds DB from dummyjson API
├── public/
│   └── temp/                       # Temp storage for Multer uploads
└── env/
    ├── .env                        # Actual secrets (git-ignored)
    └── .env.example                # Template
```

---

## Setup

### 1. Install dependencies

```bash
cd project/backend
npm install
```

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp env/.env.example env/.env
```

### 3. Start Redis

```bash
# local
redis-server

# or via Docker
docker run -p 6379:6379 redis
```

### 4. Seed the database

Fetches all 194 products from [dummyjson.com](https://dummyjson.com/products) and inserts them into MongoDB. Safe to re-run — clears existing products first.

```bash
npm run seed
```

### 5. Start the server

```bash
npm start
```

Server runs on `http://localhost:3000` by default.

---

## Environment Variables

All variables live in `env/.env`. Never commit this file.

```env
# Server
PORT=3000

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
COOKIE_EXPIRES_IN=1

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16char_app_password   # no spaces
FROM_EMAIL=your_email@gmail.com
FROM_NAME=MERN_Backend

# Razorpay
PAYMENT_API_KEY=rzp_test_...
PAYMENT_API_SECRET=your_secret
```

> **Gmail App Password** — go to Google Account → Security → 2-Step Verification → App passwords. Use the 16-character key with no spaces.

---

## API Reference

### Health

```
GET /health
```

Returns `{ "message": "Healthy" }`.

---

### Auth

#### Register

```
POST /api/v1/auth/register
```

Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "user"
}
```

Response `201`:
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "profileImage": "https://..."
}
```

- Password is hashed with bcrypt (10 rounds)
- Profile image is uploaded to Cloudinary
- Welcome email is sent asynchronously via Gmail SMTP

#### Login

```
POST /api/v1/auth/login
```

Body:
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

---

### Products

All product endpoints are Redis-cached. First request hits MongoDB; subsequent requests are served from cache.

| Method | Endpoint | Cache TTL | Description |
|---|---|---|---|
| GET | `/api/v1/products` | 5 min | All products (paginated) |
| GET | `/api/v1/products/:id` | 5 min | Single product with reviews |
| GET | `/api/v1/products/categories` | 10 min | Distinct category list |

#### Query Parameters — `GET /api/v1/products`

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `category` | string | Filter by category e.g. `beauty` |
| `search` | string | Search by title (case-insensitive) |

Example:
```
GET /api/v1/products?page=2&limit=10&category=furniture
GET /api/v1/products?search=lipstick
```

Response:
```json
{
  "total": 194,
  "page": 1,
  "limit": 20,
  "totalPages": 10,
  "products": [...]
}
```

---

## Caching

Redis is used to cache all product API responses.

- Cache key format: `cache:<full-request-url>`
- Each unique URL (including query params) gets its own cache entry
- Cache miss → MongoDB query → result stored in Redis
- Cache hit → response served directly from Redis, no DB query

**Clear all product cache** (for testing):
```bash
redis-cli FLUSHDB
```

**Clear only product keys:**
```bash
redis-cli --scan --pattern "cache:/api/v1/products*" | xargs redis-cli DEL
```

**Programmatic invalidation** (use in write endpoints):
```js
import { invalidateCache } from "../middlewares/cache.middleware.js";
await invalidateCache("cache:/api/v1/products*");
```

---

## Error Handling

All controllers use `asyncHandler` to forward errors to the global error middleware.

Custom `ApiError` class:
```js
import ApiError from "../utils/errorHandler.utils.js";
throw new ApiError(404, "Product not found");
```

Error response shape:
```json
{
  "success": false,
  "message": "Product not found",
  "stack": "..." // only in development
}
```

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start server with nodemon |
| `npm run seed` | Seed products from dummyjson into MongoDB |
