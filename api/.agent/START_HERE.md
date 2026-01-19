# 🚀 Agentic OS: Start Here

Tài liệu này là "trạm điều khiển" dành cho AI Agent. Folder `.agent` này hoàn toàn **độc lập và portable** - chứa đầy đủ kiến thức để vận hành dự án.

---

## 1. Dành cho USER (Cách Boot-up)

Khi copy folder `.agent` sang dự án mới, paste prompt này:

```
Tôi vừa copy folder `.agent` sang dự án này. Bạn là Senior Fullstack Architect.
Hãy đọc các file trong `.agent/knowledge` và `.agent/rules` để hiểu dự án.
Sau đó đề xuất kế hoạch làm việc tiếp theo.
```

---

## 2. Cấu trúc .agent (Đầy đủ)

```
.agent/
├── START_HERE.md           ← Bạn đang ở đây
├── knowledge/              ← Kiến thức dự án (Portable)
│   ├── database-schema.md  ← Toàn bộ DB schema (30+ models)
│   ├── tech-stack.md       ← Packages, dependencies (50+)
│   ├── architecture.md     ← System design, 7 ADRs
│   └── business-flows.md   ← Customer/Admin/RMA flows
├── rules/                  ← Quy tắc bắt buộc
│   ├── critical.md         ← 8 quy tắc sống còn
│   ├── coding-standards.md ← Coding conventions
│   ├── optimization.md     ← Tối ưu hóa (Zod-only, etc)
│   └── prompting.md        ← CLEAR Framework (MỚI)
├── workflows/              ← Quy trình làm việc
│   ├── feature-flow.md     ← Dev workflow chuẩn
│   └── fresh-start.md      ← Khởi tạo từ đầu (20 ngày)
└── skills/                 ← Kỹ năng chuyên sâu
    ├── solo-architect/     ← Solo dev mindset + patterns
    └── react-best-practices/ ← Vercel 50+ rules (MỚI)
```

---

## 3. Quy tắc Sống còn (BẮT BUỘC)

📖 Đọc: `.agent/rules/critical.md`

Top 3 quan trọng nhất:

- ✅ **Cập nhật CONTEXT.md sau mỗi task**
- ✅ **Không xóa file khi chưa commit**
- ✅ **Cảnh báo ngay khi có breaking change**

---

## 4. Kiến thức Dự án (Knowledge Base)

| File                           | Nội dung                            |
| ------------------------------ | ----------------------------------- |
| `knowledge/database-schema.md` | Prisma models, enums, indexes (30+) |
| `knowledge/tech-stack.md`      | NestJS, Next.js, packages (50+)     |
| `knowledge/architecture.md`    | System design, 7 ADRs, Security     |
| `knowledge/business-flows.md`  | Customer, Admin, RMA, Loyalty flows |

---

## 5. Dành cho AI Agent (Boot Sequence)

Khi bắt đầu session mới, thực hiện theo thứ tự:

1. Đọc `.agent/knowledge/architecture.md` → Hiểu Big Picture
2. Đọc `.agent/rules/critical.md` → Hiểu quy tắc bắt buộc
3. Đọc `CONTEXT.md` ở root (nếu có) → Hiểu trạng thái hiện tại
4. Bắt đầu công việc theo `.agent/workflows/`

---

## 6. Changelog

_(Agent tự cập nhật sau mỗi lần thay đổi lớn)_

- [2026-01-16] Khởi tạo portable .agent với đầy đủ knowledge base.
