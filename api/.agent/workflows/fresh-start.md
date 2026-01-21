---
description: Quy trình khởi tạo dự án Ecommerce từ đầu (Fresh Start)
---

# Workflow: Fresh Start Implementation

Quy trình chuẩn để khởi tạo dự án Ecommerce từ số 0 (hoặc Clone nền tảng này).

---

## Option A: Clone & Rename (Recommended)

Nếu bạn muốn tái sử dụng nền tảng này cho dự án mới:

1. **Clone Repo**:

   ```bash
   git clone <this-repo> my-new-project
   cd my-new-project
   ```

2. **Global Rename**:
   - Find & Replace `ecommerce-main` -> `my-new-project`
   - Find & Replace `ecommerce-api` -> `my-api`

3. **Infrastructure Setup**:
   - Xem: [.agent/knowledge/infrastructure-reference.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/infrastructure-reference.md)

---

## Option B: Manual Scaffolding (From Scratch)

### Phase 1: Foundation

1. **Tech Stack**:
   - Xem: [.agent/knowledge/tech-stack.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/tech-stack.md)

2. **Directory Structure**:
   - Setup Workspace như mô tả trong [tech-stack.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/tech-stack.md)

### Phase 2: Core Modules implementation

Tham khảo các file kiến thức sau để build đúng chuẩn Senior:

- **Database**: [.agent/knowledge/database-schema.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/database-schema.md)
- **Auth & Tenants**: [.agent/knowledge/saas-core-patterns.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/saas-core-patterns.md)
- **Testing Strategy**: [.agent/knowledge/testing-guide.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/testing-guide.md)

---

## Deployment

Sau khi code hoàn tất, làm theo [DEPLOYMENT_MASTER_PLAN.md](file:///home/mguser/ducnv/ecommerce-main/DEPLOYMENT_MASTER_PLAN.md) tại root.
