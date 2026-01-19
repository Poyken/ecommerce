---
trigger: always_on
---

# Lessons Learned & Prevention Rules 🛡️

Quy tắc này được đúc kết từ những sai lầm thực tế trong quá trình triển khai, nhằm ngăn chặn việc lặp lại.

## 1. Config Consistency Check (Lỗi DB Auth)

**Vấn đề**: Password trong `.env` (`123456`) khác với `docker-compose.yml` (`password`) gây lỗi Authentication loop.
**Rule**:

- Trước khi chạy `pnpm start:dev` hoặc deploy, **BẮT BUỘC** kiểm tra chéo (Pre-flight check) credentials giữa các file config.
- Action: Dùng lệnh `grep` hoặc mắt thường để đối chiếu `POSTGRES_PASSWORD` vs `DATABASE_URL`.

## 2. Version Compatibility (Lỗi Prisma 7 vs 5)

**Vấn đề**: Dùng tính năng của Prisma 7 (`fullTextSearchPostgres`) trong khi project cài Prisma 5, gây crash schema.
**Rule**:

- Không bao giờ đoán mò tính năng (hallucination).
- Action: Kiểm tra `package.json` để biết chính xác version đang dùng trước khi viết code config.

## 3. Docker State Management

**Vấn đề**: Thay đổi password trong `docker-compose` nhưng không xóa volume cũ -> Password mới không ăn.
**Rule**:

- Khi thay đổi biến môi trường khởi tạo Database (`POSTGRES_PASSWORD`, `POSTGRES_DB`), **PHẢI** chạy `docker compose down -v` để reset dữ liệu.

## 4. Self-Verification Enforcement

**Vấn đề**: Code xong không chạy thử, đợi user báo lỗi.
**Rule**:

- Luôn phải tự verify bằng tool (curl, script) trước khi báo `DONE`.
- Check log kỹ (`docker compose logs`) nếu thấy service start quá nhanh hoặc quá chậm.

## 5. Schema Field Verification (Lỗi InventoryLog)

**Vấn đề**: Viết code `inventoryLog.create({ type, warehouseId })` nhưng schema thực tế là `changeAmount`, `previousStock`, `newStock`. Build pass nhưng sẽ crash ở runtime.
**Rule**:

- Trước khi dùng bất kỳ Model nào trong Prisma, **BẮT BUỘC** grep schema để xác nhận field names.
- Action: `grep -A 20 "model ModelName {" schema.prisma`.
