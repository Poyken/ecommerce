# Workflow: Standard Feature Flow

Quy trình chuẩn để biến ý tưởng thành tính năng hoàn chỉnh.

## 1. Planning (Nghiên cứu)

- Phân tích yêu cầu và kiểm tra cấu trúc DB hiện tại.
- Cập nhật `CONTEXT.md` nếu có thay đổi về nghiệp vụ lớn.
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
