# Chiến lược Di chuyển Dữ liệu & Seeding

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Database  
**Trạng thái**: Bản nháp

---

### Tổng quan về Di chuyển Dữ liệu

#### Triết lý Migration

1. **Không ngừng hoạt động (Zero Downtime)**: Quá trình chuyển đổi không được làm gián đoạn việc kinh doanh của khách hàng.
2. **Toàn vẹn dữ liệu**: Đảm bảo dữ liệu không bị mất mát hoặc sai lệch sau khi di chuyển.
3. **Khả năng khôi phục (Rollback)**: Luôn có phương án quay lại trạng thái trước khi thực hiện nếu có lỗi xảy ra.
4. **An toàn Đa người thuê (Multi-tenant Safe)**: Đảm bảo việc thay đổi cấu trúc không làm lộ dữ liệu giữa các tenant.
5. **Tối ưu hiệu suất**: Thực hiện migration vào khung giờ thấp điểm và tối ưu các câu lệnh SQL để giảm thiểu tải cho hệ thống.

#### Phân loại Migration

- **Schema Migration**: Thay đổi cấu trúc bảng, thêm cột, cập nhật index hoặc ràng buộc (Constraints).
- **Data Migration**: Chuyển đổi dữ liệu từ các hệ thống cũ sang nền tảng mới, bao gồm việc làm sạch và chuyển đổi định dạng.
- **Seeding Data**: Khởi tạo các dữ liệu danh mục gốc, dữ liệu mẫu cho demo hoặc dữ liệu kiểm thử.

---

### Chiến lược Schema Migration

- **Công cụ sử dụng**: Prisma Migrate.
- **Quy trình thực hiện**:
  1. Sao lưu (Backup) database hiện tại.
  2. Tạo bản nháp migration và kiểm tra trên môi trường Staging.
  3. Áp dụng migration vào Production.
  4. Kiểm tra tính toàn vẹn (Verification) sau khi hoàn tất.
  5. Nếu có lỗi, thực hiện Rollback ngay lập tức từ bản sao lưu.

---

### Chiến lược Chuyển đổi Dữ liệu (ETL)

- **Mapping (Ánh xạ)**: Định nghĩa rõ ràng các trường dữ liệu nguồn tương ứng với các trường trong database mới.
- **Transformation (Biến đổi)**: Xử lý định dạng dữ liệu (ví dụ: chuyển đổi đơn vị tiền tệ, định dạng ngày tháng, làm sạch khoảng trắng).
- **Validation (Kiểm tra)**: Xác thực dữ liệu trước khi nạp vào hệ thống để đảm bảo tuân thủ các ràng buộc nghiệp vụ (ví dụ: định dạng email, số điện thoại).

---

### Chiến lược Seeding Data

- **Master Data**: Khởi tạo các danh mục mặc định (ví dụ: Điện tử, Thời trang, Gia dụng).
- **Tenant Seeding**: Khi một tenant mới đăng ký, hệ thống tự động khởi tạo các thiết lập cơ bản và dữ liệu mẫu để họ có thể trải nghiệm ngay.
- **Test Data**: Các bộ dữ liệu lớn dùng để kiểm tra hiệu suất (Perf test) và khả năng chịu tải của hệ thống.

---

### Giám sát quá trình Migration

- Theo dõi tiến độ (%).
- Ghi nhật ký chi tiết các lỗi (nếu có).
- Đo lường thời gian thực hiện để cải tiến cho các lần sau.

---

### Phê duyệt

**Trưởng nhóm Database**: ********\_\_\_********  
**Trường nhóm DevOps**: ********\_\_\_********  
**Trưởng nhóm kỹ thuật (Tech Lead)**: ********\_\_\_********
