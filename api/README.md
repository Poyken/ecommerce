# Ecommerce API (NestJS)

Backend API service for the Multi-tenant Ecommerce Platform. Built with NestJS, Prisma, and PostgreSQL.

## 🚀 Overview

This is a Modular Monolith architecture designed for scalability and ease of maintenance.
It implements a **Multi-tenant SaaS** model using a Shared Database strategy with Row-Level Security (logic-based).

### Key Features

- **Domain-Driven Design (DDD)**: Organized into Feature Modules (`Sales`, `Catalog`, `Identity`, `Platform`, `CMS`).
- **High Performance**: Redis Caching (L1/L2), BullMQ Background Jobs, pgvector for AI Search.
- **Security First**: Zod Validation, RBAC, Rate Limiting, Helmet, CSRF protection.
- **Developer Experience**: Modern stack with TypeScript, Prisma, and Swagger Docs.

## 🛠 Tech Stack

- **Framework**: NestJS 10+
- **Database**: PostgreSQL (with PGVector extension)
- **ORM**: Prisma
- **Queue**: BullMQ (Redis)
- **Caching**: Redis (Cache Manager)
- **Storage**: Cloudinary (Media assets)

## 📂 Module Structure

```
src/
├── platform/       # SaaS Admin, Analytics, Subscriptions
├── identity/       # Auth, Users, Roles, Tenants
├── catalog/        # Products, Categories, Brands
├── sales/          # Orders, Cart, Payments, Tax
├── operations/     # Inventory, Fulfillment
├── marketing/      # Promotions, Loyalty
├── cms/            # Blog, Pages
└── core/           # Infrastructure (Prisma, Guards, Interceptors)
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+

### Installation

1. **Clone & Install**

   ```bash
   git clone <repo>
   cd api
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Update DATABASE_URL, REDIS_URL, etc.
   ```

3. **Database Setup**

   ```bash
   # Start DB containers
   docker-compose up -d postgres redis

   # Run migrations
   npx prisma migrate dev
   ```

4. **Run Development**
   ```bash
   npm run start:dev
   ```

## 🧪 Testing

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e
```

## 📚 Documentation

- **API Docs**: `http://localhost:8080/api/docs` (Swagger)
- **Architecture**: See `CONTEXT.md` in root directory.

## ⚠️ Security Note

Ensure `.env` is never committed to version control. Rotated all secrets if exposed.
