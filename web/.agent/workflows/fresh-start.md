---
description: Quy trình khởi tạo dự án Frontend từ số 0 (hoặc Clone)
---

# Workflow: Fresh Start Implementation (Web)

Quy trình chuẩn để khởi tạo dự án Frontend từ số 0 (hoặc Clone nền tảng này).

---

## Option A: Clone & Rename (Recommended)

Nếu bạn muốn tái sử dụng storefront này:

1. **Clone Repo**:

   ```bash
   git clone <this-repo> my-web-project
   cd my-web-project
   ```

2. **Global Rename**:
   - Find & Replace `ecommerce-web` -> `my-new-web`

3. **Infrastructure Setup**:
   - Xem: [.agent/knowledge/infrastructure-reference.md](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/infrastructure-reference.md)

---

## Option B: Manual Scaffolding (From Scratch)

### Phase 1: Foundation

1. **Tech Stack**:
   - Next.js 16 (App Router)
   - TailwindCSS 4
   - Xem: [.agent/knowledge/tech-stack.md](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/tech-stack.md)

2. **Architecture**:
   - Server Actions for Mutations.
   - SWR for Client-side fetching.
   - Xem: [.agent/knowledge/architecture.md](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/architecture.md)

### Phase 2: Core Implementation

Tham khảo các hướng dẫn chi tiết:

- **Deployment**: [.agent/knowledge/infrastructure-reference.md](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/infrastructure-reference.md)
- **SEO Strategy**: [.agent/knowledge/seo-optimization-guide.md](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/seo-optimization-guide.md)
- **Testing**: [.agent/knowledge/testing-guide-e2e.md](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/testing-guide-e2e.md)

---

## Deployment

Sau khi code hoàn tất, làm theo [DEPLOYMENT_MASTER_PLAN.md](file:///home/mguser/ducnv/ecommerce-main/DEPLOYMENT_MASTER_PLAN.md) tại root.
