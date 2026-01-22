# API Modules Map

Document reflecting the current module structure in `api/src/`.

---

## 1. Domain Modules

### Identity (`src/identity/`)

Authentication, User Management, and Multi-tenancy.

- `auth`: JWT, Passport strategies, Guards.
- `users`: User profile management.
- `roles`: RBAC (Roles & Permissions).
- `tenants`: SaaS Tenant management.

### Catalog (`src/catalog/`)

Product management.

- `products`: Core product logic.
- `categories`: Category tree.
- `brands`: Brand management.
- `skus`: Inventory/Price variant units.

### Sales (`src/sales/`)

Order processing and checkout.

- `orders`: Order lifecycle.
- `cart`: Shopping cart.
- `payment`: Payment gateways (VNPAY, MOMO).
- `invoices`: Billing generation.
- `shipping`: 3PL Integrations.

### Operations (`src/operations/`)

Back-office operations.

- `inventory`: Warehouse & Stock management.
- `fulfillment`: Order picking/packing.
- `procurement`: Supplier & Purchase Orders.

### Marketing (`src/marketing/`)

Customer engagement.

- `promotions`: Discount engine.
- `loyalty`: Points & Rewards.
- `reviews`: Product reviews.

### CMS (`src/cms/`)

Content Management.

- `blog`: Blog posts.
- `pages`: Static pages.
- `media`: File/Asset management.

### Platform (`src/platform/`)

Admin & System level features.

- `admin`: APIs for Admin Dashboard.
- `analytics`: Business metrics.
- `settings`: System configurations.

---

## 2. Specialized Modules

### AI (`src/ai/`)

Artificial Intelligence features.

- `chat`: RAG-based Chatbot.
- `insights`: Smart recommendations.

### Chat (`src/chat/`)

Real-time user support.

- `conversations`: Support tickets/chats.
- `gateway`: WebSocket gateway.

### Notifications (`src/notifications/`)

- Email & Push notification delivery.

### Audit (`src/audit/`)

- System-wide audit logging.

### Worker (`src/worker/`)

- BullMQ Background job processors.

---

## 3. Core & Shared

### Core (`src/core/`)

Infrastructure layer.

- `prisma`: Database connection.
- `redis`: Caching layer.
- `config`: Environment configuration.
- `decorators`: Custom decorators (@CurrentUser, etc).
- `interceptors`: Response transformation.
- `filters`: Global exception handling.

### Common (`src/common/`)

Shared utilities.

- `dtos`: Shared Data Transfer Objects.
- `utils`: Helper functions.
- `constants`: System constants.
