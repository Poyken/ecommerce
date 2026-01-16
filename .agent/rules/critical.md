# Critical Operational Rules (Quy tắc sống còn)

Đây là các quy tắc **BẮT BUỘC** mà Agent phải tuân thủ trong mọi tình huống.

---

## 1. Context Update After Every Task ✅

**Mỗi khi hoàn thành một task**, Agent PHẢI cập nhật `CONTEXT.md`:

```markdown
// Thêm vào cuối CONTEXT.md

## Changelog

- [YYYY-MM-DD] Mô tả task vừa hoàn thành
```

**Lý do**: Đây là "bộ nhớ dài hạn". Nếu không cập nhật, Agent mới sẽ không biết những gì đã làm.

---

## 2. Commit Message Standards

Mỗi commit phải tuân theo format:

```
[TYPE] Brief description

TYPE:
- feat: Tính năng mới
- fix: Sửa lỗi
- refactor: Tái cấu trúc
- docs: Tài liệu
- chore: Công việc phụ
```

---

## 3. Never Delete Without Backup

- **KHÔNG BAO GIỜ** xóa file/code mà không có backup hoặc git commit trước đó.
- Nếu cần xóa, sử dụng **soft delete** hoặc comment out trước.

---

## 4. Breaking Change Alert

Nếu một thay đổi có thể gây **breaking change**:

1. Dừng lại và thông báo USER ngay.
2. Liệt kê các file/module bị ảnh hưởng.
3. Chờ xác nhận trước khi tiếp tục.

---

## 5. Schema Change = Migration Required

Mọi thay đổi `schema.prisma` PHẢI đi kèm:

```bash
npx prisma migrate dev --name describe_change
```

**KHÔNG BAO GIỜ** dùng `prisma db push` trong production.

---

## 6. Test Before Claim Done

Trước khi tuyên bố "xong":

- [ ] Code build thành công (`npm run build`)
- [ ] Lint pass (`npm run lint`)
- [ ] Critical paths đã test (manual hoặc automated)

---

## 7. Document Architectural Decisions

Mọi quyết định kiến trúc lớn phải ghi vào `CONTEXT.md` dưới mục **ADR**:

```markdown
## 4. Quyết định Kiến trúc (ADR)

- **ADR-XXX**: [Tên quyết định]
  - Lý do: ...
  - Trade-offs: ...
```

---

## 8. Sync `.agent` Across Workspaces

Khi chuyển workspace hoặc bắt đầu session mới:

1. Đọc `CONTEXT.md` đầu tiên.
2. Đọc `.agent/rules/` để hiểu standards.
3. Đọc `.agent/workflows/` trước khi thực hiện bất kỳ task nào.
