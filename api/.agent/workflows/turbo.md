---
description: Quy trình tự động hóa thực thi (Turbo Mode) cho Agent
---

### Turbo Mode: Autonomous High-Speed Flow

Workflow này cho phép Agent thực hiện các Phase lớn một cách tự động sau khi được xác nhận **"Turbo OK"**.

1. **Batch Planning**:
   - Lập `implementation_plan.md` cho toàn bộ giai đoạn/phase.
   - Nhận phê duyệt kế hoạch duy nhất một lần.

2. **Sequential Implementation (Auto)**:
   - Thực hiện code từng module theo thứ tự phụ thuộc.
   - **Check-point sau mỗi file**: Chạy `npm run build` (api/web) hoặc `tsc` để verify syntax.
   - Nếu gặp lỗi, tự động fix trước khi sang file tiếp theo.

3. **Self-Verification & Audit (Auto)**:
   - Chạy `grep` để audit code với các cấm kỵ (Zod-first, no unused code).
   - Verify logic Multi-tenancy Isolation.

4. **Continuous Reporting**:
   - Cập nhật `CONTEXT.md` và `task.md` sau mỗi sub-task.
   - Tổng hợp kết quả vào `walkthrough.md`.

5. **Stop Conditions**:
   - Gặp lỗi logic không tự giải quyết được.
   - Cần thay đổi kiến trúc lớn không có trong Plan ban đầu.
   - Người dùng gửi yêu cầu dừng lại.

// turbo-all 6. Chạy lệnh: `pnpm run build` để kiểm tra lần cuối toàn monorepo.
