# PM Operation Guide: Managing AI-Native Projects

> **Role**: Project Manager (PM) / Product Owner (PO)
> **Goal**: Vận hành dự án hiệu quả tối đa với đội ngũ AI Agents.

---

## 1. Tư duy cốt lõi (Mindset)

Trong kỷ nguyên AI Coding, vai trò PM chuyển dịch từ "người đốc thúc tiến độ" sang **"Kiến trúc sư yêu cầu" (Prompt Architect)**.

- **AI là Super-Senior Dev**: Nó code rất nhanh, nhưng cần chỉ dẫn cực kỳ cụ thể (Context).
- **Hồ sơ năng lực (.agent)**: Đây là "bộ não" dự án. PM phải giữ cho nó luôn đúng (Single Source of Truth). Code sai sửa được, nhưng Context sai thì toàn bộ tính năng sau này sẽ sai theo.

---

## 2. Quy trình làm việc (The Workflow)

### Bước 1: Define Specs (Viết yêu cầu)

Thay vì viết Ticket Jira sơ sài, PM cần viết hoặc cập nhật các file `.agent`:

- **Logic mới**: Thêm vào `business-flows.md`.
- **UI mới**: Mô tả trong `architecture.md` (Web) hoặc tạo file design spec riêng.
- **Quy tắc**: Cập nhật `rules/critical.md` nếu có luật chơi mới.

### Bước 2: The "Implementation Plan" Check

**KHÔNG BAO GIỜ** cho AI code ngay.

1. Yêu cầu AI tạo `implementation_plan.md`.
2. PM review plan này:
   - Có đúng logic không?
   - Có ảnh hưởng tính năng cũ không? (Breaking changes)
   - Có vi phạm bảo mật không?
3. Chỉ `Approved` khi Plan đã hoàn hảo.

### Bước 3: Verification (Nghiệm thu)

AI code xong thường hay... ảo giác (hallucination). PM cần:

1. Yêu cầu AI tự viết Test (E2E Test).
2. Yêu cầu AI chạy `fresh-start` workflow để đảm bảo không bị "works on my machine".
3. Tự mình kiểm tra trên Staging environment (theo `DEPLOYMENT_MASTER_PLAN.md`).

---

## 3. Cách "nói chuyện" với AI (Prompting for PM)

**❌ Bad Prompt:**
"Làm thêm tính năng Affiliate đi."

**✅ Good Prompt (theo chuẩn CLEAR):**
"Tôi muốn thêm tính năng Affiliate Marketing.

- **Context**: Đã có `User` table và `Order` table.
- **Specs**:
  - User có thêm trường `referralCode`.
  - Khi User B đăng ký với code của User A -> Lưu quan hệ.
  - Khi User B mua hàng -> User A nhận được điểm thưởng (theo `LoyaltyService`).
- **Constraint**: Chỉ làm API, chưa cần UI. Đừng sửa logic thanh toán hiện tại.
- **Output**: Hãy cập nhật `business-flows.md` trước, sau đó đề xuất `implementation_plan.md`."

---

## 4. Bảo trì "Bộ nhớ" (Knowledge Gardening)

Mỗi tuần 1 lần, PM cần rà soát lại thư mục `.agent`:

- Xóa các file rác, file nháp.
- Cập nhật `tech-stack.md` nếu có thư viện mới.
- Đảm bảo `CONTEXT.md` phản ánh đúng trạng thái hiện tại.

**Quy tắc vàng:** _Nếu nó không có trong `.agent`, đối với AI (và dev mới), nó không tồn tại._
