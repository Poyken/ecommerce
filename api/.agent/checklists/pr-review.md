# PR Review Checklist (Strict)

> **Mục tiêu:** Đảm bảo code quality đồng nhất, bảo mật và hiệu năng.
> **Quy tắc:** Reviewer phải check vào từng mục. Nếu có mục **CRITICAL** chưa đạt, PR phải bị Reject ngay lập tức.

## 1. 🚨 CRITICAL (Chặn Merge)

> Các lỗi này ảnh hưởng trực tiếp đến hệ thống, bảo mật hoặc convention cốt lõi. **Không thương lượng.**

- [ ] **Security: No Hardcoded Secrets**
  - _Why:_ Lộ API Key/DB Credential là thảm họa bảo mật.
  - _Check:_ Tìm string lạ, key lạ trong code. File `.env` không được commit.
- [ ] **Security: SQL Injection / Raw Queries**
  - _Why:_ Prisma hỗ trợ tốt, hạn chế tối đa `prisma.$queryRaw` trừ khi benchmark chứng minh cần thiết.
  - _Check:_ Kiểm tra input params có được sanitize hoặc dùng ORM method không.
- [ ] **Data Integrity: No Client-Side Logic for Data Critical**
  - _Why:_ Logic tính tiền, giảm giá phải nằm ở Backend (Service layer), không tin tưởng data từ Client (DTO phải validate).
  - _Check:_ `create-order`, `payment` logic.
- [ ] **Conventions: Naming Strategy (File/Folder)**
  - _Why:_ Project dùng `kebab-case`. Sai naming gây khó khăn cho OS Case-insensitive (Windows/macOS) khi deploy lên Linux.
  - _Check:_ File mới có đúng `kebab-case.ts`? Folder có đúng `kebab-case`?
- [ ] **Conventions: Class & DI**
  - _Why:_ NestJS DI dựa vào Class Token.
  - _Check:_ Class Controller/Service có đúng `PascalCase`? Có `@Injectable()`?

## 2. ⚠️ MAJOR (Cần sửa)

> Các lỗi này ảnh hưởng đến maintenability và performance. Cần sửa trước khi merge.

- [ ] **Performance: N+1 Query (Prisma)**
  - _Why:_ ORM rất dễ dính N+1 khi loop qua list để query detail.
  - _Check:_ Có vòng lặp `for` chứa `await prisma...` không? (Dùng `Promise.all` hoặc `include` của Prisma).
- [ ] **TypeScript: No `any` (Strict Mode)**
  - _Why:_ Dùng `any` làm mất tác dụng của TS.
  - _Check:_ Có `user: any` hay `as any` không cần thiết không? (Trừ trường hợp Prisma Complex Return đã note trong Exception).
- [ ] **Error Handling: Throw correct Exception**
  - _Why:_ Frontend dựa vào statusCode để hiển thị lỗi.
  - _Check:_ Service có `throw new HttpException` không? Hay đang `return null` im lặng?
- [ ] **API Design: DTO Validation**
  - _Why:_ Bảo vệ controller khỏi rác.
  - _Check:_ Các field trong DTO có gắn decorator `class-validator` (`@IsString`, `@IsInt`) không?

## 3. 📝 MINOR (Nhắc nhở)

> Có thể merge nhưng nên fix để code đẹp hơn (Clean Code).

- [ ] **Code Structure: Import Order**
  - _Why:_ Giữ file gọn gàng, dễ đọc.
  - _Check:_ External Libs -> Internal Alias (`@core`) -> Relative (`./`).
- [ ] **Documentation: JSDoc for Complex Logic**
  - _Why:_ Code phức tạp sau 1 tháng tác giả cũng quên.
  - _Check:_ Hàm logic > 20 dòng có comment giải thích flow không?
- [ ] **Clean Code: No Console.log**
  - _Why:_ Làm bẩn log server production.
  - _Check:_ Xóa các `console.log` debug thừa. Dùng `Logger` service nếu cần log.
- [ ] **Git: Commit Message**
  - _Why:_ Generate Changelog tự động.
  - _Check:_ Có theo format `feat: ...`, `fix: ...` không?
