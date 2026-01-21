# 🚀 E-commerce Web: Developer Onboarding

> **Chào mừng bạn đến với Frontend của dự án Ecommerce!**
> Tài liệu này giúp Frontend Developer & UI/UX Designer nắm bắt dự án Next.js 16 (App Router) này.

---

## 1. Bạn là ai? (Chọn Role của bạn)

### 🎨 Frontend Developer (Triển khai UI/UX)

Bạn cần dựng UI, ghép API và xử lý logic client?
👉 **Bắt đầu tại đây**:

1. **Dựng môi trường**: Làm theo [workflows/fresh-start.md](workflows/fresh-start.md).
2. **Kiến trúc FE**: Đọc [knowledge/architecture.md](knowledge/architecture.md) (Server Actions + SWR Pattern).
3. **Design System**: Đọc [knowledge/admin-ui-design-system.md](knowledge/admin-ui-design-system.md) (Shadcn UI + Tailwind 4).
4. **Code Feature**: Tuân thủ [workflows/feature-flow.md](workflows/feature-flow.md).

### 🚀 Performance & SEO Specialist

Bạn cần tối ưu tốc độ tải trang và chỉ số SEO?
👉 **Đọc ngay**:

1. **SEO Guide**: [knowledge/seo-optimization-guide.md](knowledge/seo-optimization-guide.md).
2. **Performance Rules**: [skills/react-best-practices/SKILL.md](skills/react-best-practices/SKILL.md) (50+ rules tối ưu React).
3. **Hạ tầng Web**: [knowledge/infrastructure-reference.md](knowledge/infrastructure-reference.md) (Vercel/ISR).

### 🧠 Senior Architect / Tech Lead

Bạn cần đánh giá cấu trúc component và security?
👉 **Deep-dive**:

1. **Routing Strategy**: [knowledge/architecture.md](knowledge/architecture.md) (Multi-tenant Routing: `/[locale]/shop/[tenant]`).
2. **Authentication**: [knowledge/tech-stack.md](knowledge/tech-stack.md) (Auth flow với API).
3. **Testing Strategy**: [knowledge/testing-guide-e2e.md](knowledge/testing-guide-e2e.md) (Playwright).

---

## 2. Quick Links (Tra cứu nhanh)

| Chủ đề            | File cần đọc                                               |
| :---------------- | :--------------------------------------------------------- |
| **Tech Stack**    | [knowledge/tech-stack.md](knowledge/tech-stack.md)         |
| **I18n & RTL**    | [knowledge/i18n-rtl-guide.md](knowledge/i18n-rtl-guide.md) |
| **Business Flow** | [knowledge/business-flows.md](knowledge/business-flows.md) |

---

## 3. Quy tắc "Bất khả xâm phạm" (Core Rules)

1.  **Server Actions First**: Ưu tiên gọi API qua Server Actions (được bọc bởi `next-safe-action`), hạn chế `useEffect`.
2.  **Client Component tối thiểu**: Chỉ dùng `use client` ở lá (leaf nodes).
3.  **Tailwind 4 + Shadcn**: Không viết CSS thuần nếu không cần thiết. Dùng utility classes.

---

## 4. Cần giúp đỡ?

- **Hỏi AI**: "Làm sao để thêm một page mới chuẩn architecture?"
- **Hỏi PM**: Tham khảo [pm-operation-guide.md](../../pm-operation-guide.md) ở root.
