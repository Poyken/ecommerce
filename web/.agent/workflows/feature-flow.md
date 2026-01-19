---
description: Quy trình chuẩn để phát triển tính năng mới (Standard Feature Flow)
---

# Workflow: Standard Feature Flow

Quy trình chuẩn để biến ý tưởng thành tính năng hoàn chỉnh.

## 1. Planning (Nghiên cứu)

- **Check `.agent`**: Đọc `knowledge/business-flows.md` và `tech-stack.md` trước.
- **Refine Request**: Nếu yêu cầu sơ sài, tự viết lại theo chuẩn CLEAR (Rule #11).
- **Phân tích yêu cầu**: Kiểm tra xem tính năng này cần sửa những gì.
- **Phân tích yêu cầu**: Kiểm tra xem tính năng này cần sửa những gì.
- **Implementation Plan**: Tạo file `implementation_plan.md` và **CHỜ USER DUYỆT**.
- Phác thảo schema (Prisma/Zod) trước khi code.

## 2. Foundation (Nền tảng)

- Cập nhật `schema.prisma`.
- Chạy `npx prisma migrate dev`.
- Tạo Shared Types/Schemas nếu là dự án Monorepo.

## 3. Implementation (Thực thi)

- **Backend First**: Tạo controller, service, repository. Viết logic core và test.
- **Frontend Second**: Xây dựng UI, kết nối API/Server Actions.
- Sử dụng Shadcn/UI để build giao diện nhanh và đẹp.

## 4. Perfection (Hoàn thiện)

- Lint code: `npm run lint`.
- Viết integration test cho luồng chính.
- Ghi nhật ký thay đổi vào `walkthrough.md`.
