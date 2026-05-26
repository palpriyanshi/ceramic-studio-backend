# Migrating to Microservices

This document explains how to break the current monolith into microservices — what to split, how services talk to each other, and what infrastructure you need.

---

## Current Monolith vs Target Architecture

```
MONOLITH (now)                     MICROSERVICES (target)
──────────────────────             ──────────────────────────────────────
single Express app          →      API Gateway
  /api/v1/auth              →        Auth Service        :4001
  /api/v1/users             →        User Service        :4002
  /api/v1/products          →        Product Service     :4003
  /api/v1/orders            →        Order Service       :4004
                                     Notification Service :4005
                                     Payment Service     :4006
single MongoDB              →      one DB per service
single Redis instance       →      shared cache / message broker
```

---

## Step 1 — Identify Service Boundaries

Split along domain boundaries. Each service owns its data and logic.

| Service | Owns | DB Collection |
|---|---|---|
| Auth Service | register, login, JWT issue | — (stateless) |
| User Service | user profiles, avatars, passwords | `users` |
| Product Service | product CRUD, categories, seeder | `products` |
| Order Service | order lifecycle, stock updates | `orders` |
| Notification Service | emails, push notifications | — (stateless) |
| Payment Service | Razorpay integration | `payments` |

---

## Step 2 — Extract Each Service

Each service becomes its own Node.js project with this structure:

```
services/
├── auth-service/
│   ├── index.js
│   ├── src/app.js
│   ├── controllers/
│   ├── models/          # no models — auth is stateless (JWT)
│   ├── routes/
│   ├── middlewares/
│   ├── utils/
│   ├── package.json
│   └── env/.env
│
├── user-service/
│   ├── index.js
│   ├── src/app.js
│   ├── controllers/
│   ├── models/user.model.js
│   ├── routes/
│   └── ...
│
├── product-service/
│   └── ...              # product model, controller, seeder
│
├── order-service/
│   └── ...              # order model, controller
│
├── notification-service/
│   └── ...              # nodemailer, event listeners
│
├── payment-service/
│   └── ...              # razorpay integration
│
└── api-gateway/
    └── ...              # single entry point, routes to services
```

---

## Step 3 — Add an API Gateway

The gateway is the only public-facing service. It:
- Receives all client requests
- Verifies JWT (so individual services don't need to)
- Proxies requests to the correct service
- Handles CORS and rate limiting centrally

```
Client → API Gateway (:3000)
              ↓
    ┌─────────┴──────────┐
    │  verify JWT        │
    │  rate limit        │
    │  route to service  │
    └─────────┬──────────┘
              ↓
  ┌───────────────────────┐
  │  /auth/*   → :4001    │
  │  /users/*  → :4002    │
  │  /products → :4003    │
  │  /orders/* → :4004    │
  └───────────────────────┘
```

Use `http-proxy-middleware` or a dedicated gateway like **Kong**, **Nginx**, or **AWS API Gateway**.

Simple Node.js gateway example:

```js
// api-gateway/src/app.js
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import verifyToken from "./middlewares/verifyToken.js";

const app = express();

app.use("/api/v1/auth",     createProxyMiddleware({ target: "http://auth-service:4001" }));
app.use("/api/v1/users",    verifyToken, createProxyMiddleware({ target: "http://user-service:4002" }));
app.use("/api/v1/products", createProxyMiddleware({ target: "http://product-service:4003" }));
app.use("/api/v1/orders",   verifyToken, createProxyMiddleware({ target: "http://order-service:4004" }));
```

---

## Step 4 — Service-to-Service Communication

Services need to talk to each other. Two patterns:

### Synchronous (HTTP) — for real-time needs

When Order Service needs to check product stock:

```
Order Service  →  HTTP GET  →  Product Service
               ←  { stock }  ←
```

Use `axios` inside the service:

```js
// order-service/utils/productClient.js
import axios from "axios";

const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL;

export async function getProduct(productId) {
  const { data } = await axios.get(`${PRODUCT_SERVICE}/api/v1/products/${productId}`);
  return data;
}

export async function decrementStock(productId, quantity) {
  await axios.patch(`${PRODUCT_SERVICE}/api/v1/products/${productId}/stock`, { quantity });
}
```

### Asynchronous (Message Queue) — for fire-and-forget events

When Order Service places an order, it emits an event. Notification Service listens and sends the email. Neither service waits for the other.

```
Order Service  →  publish "order.created"  →  Redis Pub/Sub or RabbitMQ
                                               ↓
                                    Notification Service listens
                                    → sends confirmation email
```

Using Redis Pub/Sub (already have Redis):

```js
// order-service — publish after order created
import { getRedisClient } from "../config/redis.config.js";

await getRedisClient().publish("order.created", JSON.stringify({
  orderId: order._id,
  userEmail: user.email,
  userName: user.name,
  grandTotal: order.grandTotal,
}));
```

```js
// notification-service — subscribe and handle
import { createClient } from "redis";

const subscriber = createClient({ url: process.env.REDIS_URL });
await subscriber.connect();

await subscriber.subscribe("order.created", (message) => {
  const { userEmail, userName, grandTotal } = JSON.parse(message);
  sendOrderConfirmationEmail(userEmail, userName, grandTotal);
});
```

Events to publish from each service:

| Service | Event | Consumers |
|---|---|---|
| Auth | `user.registered` | Notification (welcome email) |
| Order | `order.created` | Notification (confirmation email), Payment |
| Order | `order.cancelled` | Notification, Product (restore stock) |
| Payment | `payment.success` | Order (update payment status) |
| Payment | `payment.failed` | Order (mark failed), Notification |

---

## Step 5 — Database Per Service

Each service gets its own MongoDB database. They never share collections directly.

```
auth-service      → no DB (JWT is stateless)
user-service      → mongodb://user-db:27017/users
product-service   → mongodb://product-db:27017/products
order-service     → mongodb://order-db:27017/orders
payment-service   → mongodb://payment-db:27017/payments
```

In each service's `.env`:
```env
MONGO_URI=mongodb://localhost:27017/users   # scoped to that service only
```

---

## Step 6 — Shared Code

Some code is used by every service (ApiError, asyncHandler, verifyToken). Don't copy-paste it.

Options:
1. **Private npm package** — publish `@yourapp/shared` to a private registry
2. **Git submodule** — shared repo included in each service
3. **Copy per service** — simplest, acceptable for small teams

```
shared/
├── utils/
│   ├── asyncHandler.js
│   └── ApiError.js
└── middlewares/
    └── verifyToken.js
```

---

## Step 7 — Docker & Docker Compose

Each service runs in its own container.

```yaml
# docker-compose.yml
version: "3.9"

services:
  api-gateway:
    build: ./api-gateway
    ports: ["3000:3000"]
    environment:
      - AUTH_SERVICE_URL=http://auth-service:4001
      - USER_SERVICE_URL=http://user-service:4002
      - PRODUCT_SERVICE_URL=http://product-service:4003
      - ORDER_SERVICE_URL=http://order-service:4004

  auth-service:
    build: ./services/auth-service
    ports: ["4001:4001"]
    environment:
      - JWT_SECRET=${JWT_SECRET}

  user-service:
    build: ./services/user-service
    ports: ["4002:4002"]
    depends_on: [mongo-users]
    environment:
      - MONGO_URI=mongodb://mongo-users:27017/users

  product-service:
    build: ./services/product-service
    ports: ["4003:4003"]
    depends_on: [mongo-products, redis]
    environment:
      - MONGO_URI=mongodb://mongo-products:27017/products
      - REDIS_URL=redis://redis:6379

  order-service:
    build: ./services/order-service
    ports: ["4004:4004"]
    depends_on: [mongo-orders, redis]
    environment:
      - MONGO_URI=mongodb://mongo-orders:27017/orders
      - REDIS_URL=redis://redis:6379
      - PRODUCT_SERVICE_URL=http://product-service:4003

  notification-service:
    build: ./services/notification-service
    ports: ["4005:4005"]
    depends_on: [redis]
    environment:
      - REDIS_URL=redis://redis:6379
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}

  payment-service:
    build: ./services/payment-service
    ports: ["4006:4006"]
    depends_on: [mongo-payments, redis]
    environment:
      - MONGO_URI=mongodb://mongo-payments:27017/payments
      - PAYMENT_API_KEY=${PAYMENT_API_KEY}
      - PAYMENT_API_SECRET=${PAYMENT_API_SECRET}

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mongo-users:
    image: mongo:7
    volumes: ["mongo-users-data:/data/db"]

  mongo-products:
    image: mongo:7
    volumes: ["mongo-products-data:/data/db"]

  mongo-orders:
    image: mongo:7
    volumes: ["mongo-orders-data:/data/db"]

  mongo-payments:
    image: mongo:7
    volumes: ["mongo-payments-data:/data/db"]

volumes:
  mongo-users-data:
  mongo-products-data:
  mongo-orders-data:
  mongo-payments-data:
```

---

## Migration Strategy (Do It Gradually)

Don't rewrite everything at once. Strangle the monolith one service at a time.

```
Week 1:  Extract Notification Service (lowest risk — fire-and-forget)
Week 2:  Extract Product Service (no cross-service dependencies)
Week 3:  Extract Auth Service + add API Gateway
Week 4:  Extract User Service
Week 5:  Extract Order Service (depends on Product)
Week 6:  Extract Payment Service
Week 7:  Decommission monolith
```

At each step, the monolith still runs. The gateway routes some paths to the new service and the rest to the monolith until everything is migrated.

---

## What You Need to Install Per Service

```bash
# Each service
npm install express dotenv mongoose cors cookie-parser

# API Gateway only
npm install http-proxy-middleware

# Services that need auth verification
npm install jsonwebtoken

# Notification Service
npm install nodemailer redis

# Product / Order Service (caching)
npm install redis

# Payment Service
npm install razorpay

# All services (dev)
npm install -D nodemon
```

---

## Summary Checklist

- [ ] Create folder per service under `services/`
- [ ] Move controllers, models, routes into each service
- [ ] Give each service its own `package.json`, `.env`, `index.js`
- [ ] Create `api-gateway/` with proxy middleware and JWT verification
- [ ] Set up Redis Pub/Sub for async events between services
- [ ] Add HTTP clients (`axios`) for synchronous service-to-service calls
- [ ] Write a `Dockerfile` per service
- [ ] Write `docker-compose.yml` to orchestrate everything
- [ ] Extract shared utilities into a shared package or copy per service
- [ ] Update CORS in gateway to allow frontend origin
- [ ] Test each service independently before wiring them together
