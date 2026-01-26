# Kế hoạch Phục hồi Thảm họa & Liên tục Kinh doanh

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Liên tục Kinh doanh  
**Trạng thái**: Bản nháp

---

### Tóm tắt Điều hành

Tài liệu này vạch ra chiến lược phục hồi sau thảm họa (DR) và đảm bảo tính liên tục của kinh doanh (BCP) cho nền tảng E-commerce. Mục tiêu là giảm thiểu tối đa thời gian ngừng hoạt động và bảo vệ dữ liệu khách hàng trong trường hợp xảy ra sự cố nghiêm trọng.

#### Các chỉ số mục tiêu (SLAs)

| Chỉ số                             | Mục tiêu | Giải thích                                             |
| ---------------------------------- | -------- | ------------------------------------------------------ |
| **RTO** (Recovery Time Objective)  | 4 giờ    | Thời gian tối đa để hệ thống hoạt động trở lại.        |
| **RPO** (Recovery Point Objective) | 15 phút  | Khoảng thời gian mất dữ liệu tối đa chấp nhận được.    |
| **MTD** (Max Tolerable Downtime)   | 8 giờ    | Ngưỡng thời gian tối đa doanh nghiệp có thể chịu đựng. |

---

### Chiến lược Phục hồi Thảm họa (DR)

#### Kiến trúc đa vùng (Multi-Region)

- **Vùng chính (Primary)**: Chạy toàn bộ ứng dụng và Database đang hoạt động.
- **Vùng phụ (Secondary)**: Duy trì một bản sao Database (Read Replica) và cấu hình sẵn hạ tầng chờ (Hot Standby) để sẵn sàng chuyển đổi khi vùng chính gặp sự cố.
- **Vùng dự phòng (Tertiary)**: Lưu trữ các bản sao lưu dài hạn (Cold Storage).

#### Quy trình Phục hồi Database

1. Ngắt kết nối từ ứng dụng đến Database bị lỗi.
2. Chuyển đổi Read Replica ở vùng phụ lên làm Master (Promote).
3. Cập nhật cấu hình ứng dụng để trỏ đến Database mới.
4. Kiểm tra tính toàn vẹn của dữ liệu và khôi phục từ bản sao lưu nếu cần thiết.

---

### Chiến lược Sao lưu (Backup)

#### Phân loại dữ liệu sao lưu

- **Dữ liệu giao dịch & Khách hàng**: Sao lưu hằng giờ, lưu trữ trong 7 năm.
- **Danh mục sản phẩm**: Sao lưu hằng ngày, lưu trữ trong 1 năm.
- **Log hệ thống**: Sao lưu hằng giờ, lưu trữ trong 90 ngày.

#### Quy trình tự động

- Sử dụng script tự động để nén và đẩy bản sao lưu lên S3 (với mã hóa AES-256).
- Hằng tuần thực hiện khôi phục thử nghiệm (Test restore) để đảm bảo bản sao lưu hoạt động tốt.

---

### Kế hoạch Phản ứng Sự cố (Incident Response)

#### Các cấp độ nghiêm trọng

- **SEV-0 (Khẩn cấp)**: Hệ thống ngừng hoạt động hoàn toàn.
- **SEV-1 (Cao)**: Tính năng chính bị lỗi (ví dụ: không thể thanh toán).
- **SEV-2 (Trung bình)**: Lỗi ảnh hưởng đến một nhóm nhỏ người dùng.
- **SEV-3 (Thấp)**: Các lỗi nhỏ về giao diện hoặc thông tin.

#### Đội ngũ xử lý

- **Chỉ huy sự cố (Incident Commander)**: Điều phối chung.
- **Trưởng nhóm kỹ thuật**: Trực tiếp xử lý lỗi.
- **Trưởng nhóm truyền thông**: Thông báo cho khách hàng và đối tác.

---

### Kiểm thử và Bảo trì

- **Hằng tháng**: Kiểm tra tính toàn vẹn của bản sao lưu.
- **Hằng quý**: Diễn tập phản ứng sự cố và giả lập lỗi một phần hệ thống.
- **Hằng năm**: Diễn tập khôi phục thảm họa toàn diện (Full DR drill).

---

### Phê duyệt

**Quản lý Liên tục Kinh doanh**: ********\_\_\_********  
**Giám đốc Công nghệ (CTO)**: ********\_\_\_********  
**Tổng Giám đốc (CEO)**: ********\_\_\_********
