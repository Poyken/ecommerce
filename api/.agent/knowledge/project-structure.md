# Project Structure Map

This document maps the source code structure (`api/src`) to the logical domains of the application.

---

## 1. Core & Infrastructure (`api/src/core`)

The backbone of the application, handling cross-cutting concerns.

| Module/Directory | Purpose                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `core`           | Core shared modules (Prisma, Redis, Guards, Interceptors, Middlewares).   |
| `common`         | Shared utilities, DTOs, and constants used across multiple modules.       |
| `audit`          | System-wide audit logging (AuditLog table).                               |
| `worker`         | Background job processing (BullMQ consumers).                             |
| `integrations`   | External service integrations (Cloudinary, SendGrid/Nodemailer, Sitemap). |
| `dev-tools`      | Developer utilities (e.g., seeding, debug endpoints).                     |
| `webhooks`       | Incoming webhook handlers.                                                |
| `scripts`        | Maintainance and utility scripts.                                         |
| `testing`        | Test helpers and setup.                                                   |

## 2. Authentication & Tenancy

| Module            | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `auth`            | Authentication (Login, Register, JWT, OAuth).   |
| `users`           | User management (Profile, Settings).            |
| `roles`           | RBAC (Role-Based Access Control) & Permissions. |
| `tenants`         | Tenant management (SaaS stores).                |
| `super-admin`     | Platform administration (Root level).           |
| `customer-groups` | Customer segmentation (VIP, Wholesale).         |

## 3. Catalog & Content

| Module    | Purpose                                                         |
| --------- | --------------------------------------------------------------- |
| `catalog` | **Root Module**. Aggregates Brands, Categories, Products, SKUs. |
| `media`   | File management (Images, Videos).                               |
| `reviews` | Product reviews and ratings.                                    |
| `blog`    | Content Management System (CMS) for blog posts.                 |
| `pages`   | Static pages (About Us, Terms).                                 |

## 4. Sales & Fulfillment

| Module            | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| `sales`           | **Root Module**. Aggregates transactional flows.             |
| `cart`            | Shopping cart management.                                    |
| `orders`          | Order processing and lifecycle.                              |
| `payment`         | Payment gateways (Stripe, Momo, VNPAY) and transaction logs. |
| `invoices`        | VAT Invoice generation.                                      |
| `shipping`        | Shipping calculations and carrier integration.               |
| `fulfillment`     | Order fulfillment logic.                                     |
| `addresses`       | User address book.                                           |
| `tax`             | Tax calculation logic.                                       |
| `return-requests` | RMA (Return Merchandise Authorization) flow.                 |
| `procurement`     | Purchasing from suppliers (B2B).                             |

## 5. Inventory & Supply Chain

| Module             | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `inventory`        | Stock management, Warehouses, Inventory Logs. |
| `inventory-alerts` | Low stock notifications.                      |

## 6. Marketing & Loyalty

| Module         | Purpose                             |
| -------------- | ----------------------------------- |
| `promotions`   | Discount codes, Automatic rules.    |
| `loyalty`      | Points system and Rewards.          |
| `wishlist`     | Saved items for later.              |
| `subscription` | Tenant subscription billing (SaaS). |
| `plans`        | SaaS Plans definition.              |

## 7. AI & Communication

| Module          | Purpose                                     |
| --------------- | ------------------------------------------- |
| `ai`            | **Root Module**. Chatbot, RAG, Suggestions. |
| `chat`          | Real-time chat (Human support).             |
| `notifications` | System notifications (Push, Email).         |
| `channels`      | Sales channels integration.                 |

## 8. Analytics & Reporting

| Module      | Purpose                          |
| ----------- | -------------------------------- |
| `analytics` | Data aggregation for dashboards. |
| `reports`   | Report generation (PDF, Excel).  |

---

## Aggregation Modules

The application uses specific "Root Modules" to aggregate smaller sub-modules, keeping `AppModule` cleaner:

- `CatalogModule`: Imports `ProductsModule`, `BrandsModule`, `CategoriesModule`, `SkusModule`.
- `SalesModule`: Imports `OrdersModule`, `CartModule`, `PaymentModule`, `InvoicesModule`, `ShippingModule`.
- `AiModule`: Imports `AiChatModule`, `RagModule`, `InsightsModule`.
