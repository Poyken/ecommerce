# Thiết lập Dự án & Phát triển

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Phát triển  
**Trạng thái**: Bản nháp

---

### Tổng quan về Thiết lập

#### Triết lý Phát triển

1. **Trải nghiệm Lập trình viên (DX)**: Ưu tiên tạo môi trường làm việc thuận tiện cho lập trình viên.
2. **Chất lượng Mã nguồn**: Đảm bảo code sạch, dễ bảo trì ngay từ đầu.
3. **Tự động hóa**: Tự động hóa tối đa các quy trình lặp đi lặp lại.
4. **Cộng tác**: Khuyến khích sự phối hợp hiệu quả giữa các thành viên trong nhóm.
5. **Học hỏi liên tục**: Luôn cập nhật công nghệ và cải tiến quy trình.

#### Mục tiêu Thiết lập

- **Gia nhập (Onboarding)**: Lập trình viên mới có thể sẵn sàng làm việc trong chưa đầy 1 ngày.
- **Tính nhất quán**: Đảm bảo môi trường phát triển giống nhau giữa các máy của lập trình viên.
- **Năng suất**: Tối ưu hóa các công cụ để tăng tốc độ phát triển.
- **Chất lượng**: Tích hợp sẵn các công cụ kiểm tra chất lượng (Linting, Testing).
- **Chia sẻ kiến thức**: Đảm bảo mọi kiến thức được lưu trữ và dễ dàng truy cập.

---

### Thiết lập Phát triển tại địa phương (Local)

#### Yêu cầu hệ thống

- **Hệ điều hành**: macOS, Linux, hoặc Windows (Sử dụng WSL2).
- **RAM**: Tối thiểu 16GB, khuyến nghị 32GB để chạy mượt mà các container.
- **Dung lượng trống**: Tối thiểu 50GB.

#### Phần mềm cần thiết

- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0
- **Docker & Docker Compose**: Phiên bản mới nhất để chạy các dịch vụ phụ trợ.
- **IDE**: Khuyến nghị sử dụng Visual Studio Code với các extension được gợi ý.

#### Quy trình khởi động nhanh

1. **Clone Repository**: Sử dụng Git để tải mã nguồn về máy.
2. **Cấu hình Môi trường**: Sao chép các file `.env.example` thành `.env` và cấu hình các thông số cần thiết (DB URL, API Keys).
3. **Khởi động Hạ tầng**: Chạy `docker-compose up -d` để khởi động Database (Postgres), Redis, Elasticsearch.
4. **Cài đặt Dependency**: Chạy `npm install` trong cả thư mục `api` và `web`.
5. **Thiết lập Database**: Chạy Prisma migration và seed dữ liệu mẫu để có dữ liệu làm việc ban đầu.
6. **Chạy ứng dụng**: Khởi động server API và Web ở chế độ phát triển (Development mode).

---

### Tiêu chuẩn Mã nguồn

- **TypeScript**: Luôn sử dụng kiểu dữ liệu rõ ràng, tránh dùng `any`.
- **Naming Convention**: Sử dụng `camelCase` cho biến/hàm, `PascalCase` cho Class/Interface.
- **Format Code**: Sử dụng Prettier để tự động căn chỉnh code và ESLint để bắt các lỗi logic/style.
- **Error Handling**: Luôn xử lý lỗi một cách tường minh, sử dụng các exception tùy chỉnh để Frontend dễ dàng hiển thị thông báo.

---

### Quy trình Phát triển (Workflow)

#### Quy trình Git

- **Nhánh (Branches)**: Sử dụng mô hình `Git Flow`. Nhánh `main` cho production, `develop` cho staging, và các nhánh `feature/*` cho từng tính năng.
- **Commit Message**: Tuân thủ chuẩn `Conventional Commits` (ví dụ: `feat(auth): add login feature`).
- **Pull Request**: Mọi thay đổi code đều phải thông qua Pull Request, được ít nhất một thành viên khác review và pass các bài kiểm tra tự động (CI) trước khi merge.

#### Định nghĩa Hoàn thành (Definition of Done)

Một tính năng được coi là hoàn thành khi:

- Code đã được review và phê duyệt.
- Tất cả các unit test và integration test liên quan đều pass.
- Tài liệu API (Swagger) đã được cập nhật.
- Tính năng hoạt động đúng trên môi trường local.

---

### Kiểm thử trong Phát triển

- **Unit Test**: Viết test cho từng hàm, logic độc lập.
- **Integration Test**: Kiểm tra sự kết nối giữa API và Database.
- **Pre-commit Hooks**: Tự động chạy linting và test nhanh trước khi cho phép commit code để đảm bảo không đưa code lỗi lên repository.

---

### Phê duyệt

**Trưởng nhóm Phát triển**: ********\_\_\_********  
**Kiến trúc sư hệ thống**: ********\_\_\_********  
**Quản lý dự án**: ********\_\_\_********
