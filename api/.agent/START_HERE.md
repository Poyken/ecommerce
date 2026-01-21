# 🚀 E-commerce API: Developer Onboarding

> **Chào mừng bạn đến với Backend của dự án Ecommerce!**
> Tài liệu này được thiết kế để giúp bạn (Backend Developer) bắt nhịp dự án nhanh nhất có thể.

---

## 1. Bạn là ai? (Chọn Role của bạn)

### 🧑‍💻 Backend Developer (Triển khai & Code)

Bạn cần setup môi trường, chạy API, và bắt đầu code tính năng mới?
👉 **Bắt đầu tại đây**:

1. **Dựng môi trường**: Làm theo [workflows/fresh-start.md](workflows/fresh-start.md) (Phase 1 & 2).
2. **Hiểu Data**: Đọc [knowledge/database-schema.md](knowledge/database-schema.md) để nắm 30+ models.
3. **Hiểu Logic SaaS**: Đọc bắt buộc [knowledge/saas-core-patterns.md](knowledge/saas-core-patterns.md) để không làm sai logic Multi-tenancy.
4. **Code Feature**: Đọc [workflows/feature-flow.md](workflows/feature-flow.md).

### 👷 DevOps / Platform Engineer (Triển khai Hạ tầng)

Bạn cần deploy lên Production (Render/Railway/AWS)?
👉 **Đọc ngay**:

1. **Hạ tầng tổng quan**: [knowledge/infrastructure-reference.md](knowledge/infrastructure-reference.md).
2. **Biến môi trường**: [knowledge/environment-variables-reference.md](knowledge/environment-variables-reference.md).
3. **Monitoring**: [knowledge/monitoring-observability-guide.md](knowledge/monitoring-observability-guide.md).

### 🧠 Senior Architect / Tech Lead (Review & Design)

Bạn cần cái nhìn tổng quan, đánh giá kiến trúc và quyết định giải pháp?
👉 **Deep-dive**:

1. **Big Picture**: [knowledge/architecture.md](knowledge/architecture.md) (Design System & ADRs).
2. **AI Strategy**: [knowledge/ai-agent-architecture.md](knowledge/ai-agent-architecture.md) (RAG & Agentic Workflow).
3. **Coding Standards**: [rules/coding-standards.md](rules/coding-standards.md) & [rules/critical.md](rules/critical.md).

---

## 2. Quick Links (Tra cứu nhanh)

| Chủ đề            | File cần đọc                                                 |
| :---------------- | :----------------------------------------------------------- |
| **Tech Stack**    | [knowledge/tech-stack.md](knowledge/tech-stack.md)           |
| **Business Flow** | [knowledge/business-flows.md](knowledge/business-flows.md)   |
| **Testing**       | [knowledge/testing-guide.md](knowledge/testing-guide.md)     |
| **API Endpoints** | Chạy local và truy cập Swagger: `http://localhost:8080/docs` |

---

## 3. Quy tắc "Bất khả xâm phạm" (Core Rules)

Khi tham gia dự án này, bạn **BẮT BUỘC** tuân thủ:

1.  **Zod-First**: Không dùng class-validator. Mọi input/output phải qua Zod.
2.  **Strict Isolation**: Không bao giờ query DB mà quên `tenantId` (trừ bảng Shared).
3.  **Migration First**: Sửa schema -> Tạo migration -> Mới được sửa code.

---

## 4. Cần giúp đỡ?

- **Hỏi AI**: Copy folder `.agent` này và hỏi AI: "Giải thích cho tôi luồng Order".
- **Hỏi PM**: Tham khảo [pm-operation-guide.md](../../pm-operation-guide.md) ở root.
