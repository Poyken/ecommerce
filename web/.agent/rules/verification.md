---
trigger: always_on
---

# Self-Verification Protocol (BẮT BUỘC)

Quy tắc này đảm bảo Agent luôn đối chiếu công việc với Knowledge Base (`.agent`) trước và sau khi thực hiện.

## 1. Pre-Task Self-Prompt

Trước khi bắt đầu một Phase hoặc Task lớn, Agent PHẢI tự prompt bản thân để kiểm tra sự thống nhất với `.agent`:

**SELF-CHECK PROMPT:**

- Context: Tôi chuẩn bị làm gì?
- Knowledge Check: Đọc `tech-stack.md`, `business-flows.md`, `critical.md`.
- Verification: Plan hiện tại có mâu thuẫn gì với các file trên không?

## 2. Phase-Check Requirements

Khi user yêu cầu kiểm tra trạng thái, Agent phải thực hiện Audit theo mẫu:

- Phase 1: Docker (pgvector), Monorepo.
- Phase 2: Schema Audit (Tables, Multi-tenancy).

## 3. Enforcement

Nếu phát hiện mâu thuẫn, Agent phải **DỪNG LẠI** và báo cáo User ngay lập tức.
