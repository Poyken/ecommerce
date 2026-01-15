# Skill: Project-Specific Code Review

> **Context:** Dựa trên phân tích 50 commits gần nhất và Technical Debt hiện tại.
> **Mục tiêu:** Bắt các lỗi "đặc sản" của dự án này mà Linter không thấy được.

## Trigger Phrases

Kích hoạt Skill này khi gặp:

**Tiếng Việt:**

- "Review code này", "Check PR cho tao"
- "Code này có ổn không?", "Có vấn đề gì không?"
- "Xem thử logic này"

**English:**

- "Review this code", "Check this PR"
- "Is this code okay?", "Any issues?"
- "Look at this implementation"

**Context Detection:**

- User paste một đoạn code và hỏi ý kiến
- User mention đến "pull request", "merge", "review"
- Đang trong context của file mới tạo hoặc sửa đổi lớn

---

## 1. Top 5 "Red Flags" (Dấu hiệu nguy hiểm)

Khi review code, nếu thấy các pattern này, hãy **FLAG** ngay:

1.  **Money Floating Point Math:**
    - _Context:_ Bug `fix(orders): calculate total amount precision`.
    - _Red Flag:_ Sử dụng `number` JS trực tiếp để cộng trừ tiền tệ.
    - _Requirement:_ Bắt buộc dùng `Decimal` (Prisma) hoặc `Math.round` ở bước cuối cùng.
    - _Check:_ `totalAmount += price * quantity` -> Cần verify precision.

2.  **Auth Guards Missing:**
    - _Context:_ Project dùng `PermissionsGuard` + `JwtAuthGuard`.
    - _Red Flag:_ Controller method public (`@Post()`) mà không có `@UseGuards()`.
    - _Requirement:_ Mặc định phải kín, chỉ mở khi có lý do chính đáng (ghi comment).

3.  **Direct Queue Access:**
    - _Context:_ `orders.service.ts` dùng Outbox Pattern.
    - _Red Flag:_ `this.queue.add()` nằm ngay sau khi DB save.
    - _Requirement:_ Phải dùng Transactional Outbox (lưu event vào DB cùng transaction tạo đơn).

4.  **Looping Database Calls (N+1):**
    - _Context:_ `products.service.ts` phải batch fetch SKUs.
    - _Red Flag:_ `for (item of items) { await prisma.find(...) }`.
    - _Requirement:_ Dùng `prisma.findMany({ where: { id: { in: ids } } })`.

5.  **Hardcoded Configs:**
    - _Context:_ `constants.ts` chứa nhiều config quan trọng.
    - _Red Flag:_ String/Number magic nằm rải rác trong code (vd: `30000` shipping fee default).
    - _Requirement:_ Move vào `constants.ts` hoặc DB Config.

## 2. Naming & Structure Bad Patterns

Những lỗi naming từng bị bắt trong quá khứ:

- ❌ `AuthSvc` -> ✅ `AuthService` (Viết tắt gây khó hiểu).
- ❌ `get_user` -> ✅ `getUser` (CamelCase cho function).
- ❌ `src/features/product` -> ✅ `src/products` (Product là core domain, không nằm trong features generic).
- ❌ `interface IUser` -> ✅ `interface User` (Không dùng prefix I).

## 3. Known Technical Debt (Cần chú ý đặc biệt)

Nếu review code chạm vào các file này, hãy cẩn trọng tối đa:

- `src/orders/orders.controller.ts`: Chứa nhiều logic phức tạp, dễ break luồng thanh toán.
- `src/constants.ts`: TODO về `scriptSrc` Swagger -> Cẩn thận CSP Security.
- `src/notifications/notifications.controller.ts`: Đang có `TODO` chưa hoàn thiện -> Code mới vào đây cần check kỹ tính tương thích.

## 4. Checklist câu hỏi cho Reviewer

1.  _"Code này có nằm trong Transaction không?"_ (Nếu sửa data > 2 bảng).
2.  _"Lỗi này có bắt được bằng Test không?"_ (Yêu cầu bổ sung test case).
3.  _"Function này có quá 50 dòng không?"_ (Nếu có, yêu cầu tách nhỏ).
4.  _"Biến môi trường mới có được thêm vào env.example không?"_
