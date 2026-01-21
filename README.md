# E-commerce Platform

A modern, full-featured e-commerce platform built with **NestJS** (API) and **Next.js** (Web).

## 🚀 Features

### Core

- 🔐 **Multi-tenancy** - Isolated data per tenant with domain-based routing
- 🛒 **Shopping Cart** - Real-time cart with Zustand state management
- 📦 **Orders** - Full order lifecycle with status tracking
- 💳 **Payments** - Multiple payment gateways support
- 📊 **Analytics** - Dashboard with metrics and reports

### Technical

- 🏛️ **Clean Architecture** - Repository pattern, DI, separation of concerns
- 🧪 **Testing** - Unit tests, E2E tests, test utilities
- 📝 **API Documentation** - Swagger with custom decorators
- ⚡ **Performance** - Caching, query optimization, batch loading
- 🔒 **Security** - Helmet, CORS, rate limiting, input validation

---

## 🧠 Agent Knowledge Base

This project is powered by an extensive documentation system located in the `.agent` directories. Technical deep-dives, infrastructure references, and SaaS core patterns can be found here:

- **API Knowledge**: [api/.agent/knowledge/](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/)
- **Web Knowledge**: [web/.agent/knowledge/](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/)
- **Deployment Master Plan**: [DEPLOYMENT_MASTER_PLAN.md](file:///home/mguser/ducnv/ecommerce-main/DEPLOYMENT_MASTER_PLAN.md)

---

## 📁 Project Structure

```
ecommerce-main/
├── api/                 # NestJS Backend
│   ├── src/
│   │   ├── core/        # Core modules (auth, tenant, cache, etc.)
│   │   ├── catalog/     # Products, Categories, Brands
│   │   ├── orders/      # Order management
│   │   ├── cart/        # Shopping cart
│   │   └── ...
│   ├── prisma/          # Database schema & migrations
│   └── test/            # E2E tests
│
├── web/                 # Next.js Frontend
│   ├── app/             # App router pages
│   ├── components/      # Reusable components
│   ├── features/        # Feature modules
│   └── lib/             # Utilities, hooks, stores
│
└── .github/workflows/   # CI/CD pipelines
```

---

## 🛠️ Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### API Setup

```bash
cd api
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

### Web Setup

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

---

## 📚 Architecture

### Multi-tenancy

```typescript
// Automatic tenant filtering via AsyncLocalStorage
@Injectable()
export class ProductsRepository extends BaseRepository<Product> {
  // All queries automatically include tenantId filter
  async findBySlug(slug: string) {
    return this.model.findFirst({
      where: this.withTenantFilter({ slug }), // Auto adds tenantId
    });
  }
}
```

### State Management (Zustand)

```typescript
import { useCartStore, useAuthStore } from "@/lib/stores";

// In component
const { items, addItem, subtotal } = useCartStore();
const { user, isAuthenticated } = useAuthStore();
```

### Performance Decorators

```typescript
@LogExecutionTime(100)  // Warn if > 100ms
@Retry(3, 100)          // Retry 3 times
async fetchProducts() {
  // ...
}
```

---

## 🧪 Testing

```bash
# Unit tests
cd api && npm run test

# E2E tests
cd api && npm run test:e2e

# Coverage
cd api && npm run test:cov
```

---

## 📖 API Documentation

Swagger UI available at: `http://localhost:8080/docs`

### Custom Decorators

```typescript
@ApiPaginatedResponse(ProductDto)
@ApiAuthRequired("Get user orders")
@Get()
async findAll() { ... }
```

---

## 🚀 Deployment

### CI/CD Pipeline (GitHub Actions)

- **On PR**: Lint, type check, unit tests, E2E tests
- **On develop push**: Deploy to staging
- **On main push**: Deploy to production

### Manual Deploy

```bash
# API (Render)
npm run build && npm start

# Web (Vercel)
npm run build && npm start
```

---

## 📊 Monitoring

- **Health Check**: `/health`, `/health/ready`, `/health/info`
- **Metrics**: `/health/metrics` (Prometheus format)
- **Error Tracking**: Sentry integration

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.
