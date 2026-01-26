# Tài liệu Kiến trúc Bảo mật

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Bảo mật  
**Trạng thái**: Bản nháp

---

### Tổng quan về Kiến trúc Bảo mật

#### Triết lý Bảo mật

1. **Phòng thủ theo lớp (Defense in Depth)**: Xây dựng nhiều lớp bảo vệ chồng lớp.
2. **Zero Trust**: Không tin tưởng bất kỳ ai mặc định, luôn luôn xác minh mọi yêu cầu.
3. **Bảo mật từ khâu thiết kế (Security by Design)**: Tích hợp bảo mật vào mọi giai đoạn phát triển phần mềm.
4. **Riêng tư theo mặc định (Privacy by Default)**: Dữ liệu người dùng được bảo vệ ở mức cao nhất ngay từ đầu.
5. **Giám sát liên tục**: Theo dõi, phát hiện và phản ứng với các mối đe dọa theo thời gian thực.

#### Mục tiêu Bảo mật

- **Tính bảo mật (Confidentiality)**: Chỉ những người có quyền mới được truy cập dữ liệu.
- **Tính toàn vẹn (Integrity)**: Dữ liệu không bị thay đổi trái phép.
- **Tính sẵn sàng (Availability)**: Hệ thống luôn phục vụ người dùng khi cần.
- **Khả năng kiểm toán (Auditability)**: Mọi hành động nhạy cảm đều được ghi lại vết.

---

### Kiểm soát Truy cập và Xác thực

- **Xác thực đa yếu tố (MFA)**: Bắt buộc đối với các tài khoản quản trị và khuyến khích cho người dùng cuối.
- **Phân quyền dựa trên vai trò (RBAC)**: Định nghĩa rõ ràng các quyền hạn (Create, Read, Update, Delete) cho từng nhóm đối tượng (Admin, Manager, Customer).
- **Quản lý phiên (Session Management)**: Sử dụng JWT với thời hạn ngắn và cơ chế Refresh Token an toàn.

---

### Bảo vệ Dữ liệu

- **Mã hóa khi lưu trữ (At Rest)**: Mã hóa database, ổ đĩa và các file nhạy cảm bằng thuật toán AES-256.
- **Mã hóa khi truyền tải (In Transit)**: Bắt buộc sử dụng TLS 1.2+ cho mọi kết nối giữa Client-Server và Server-Server.
- **Lọc và làm sạch dữ liệu (Input Validation)**: Ngăn chặn các cuộc tấn công Injection (SQLi, XSS) bằng cách kiểm tra dữ liệu đầu vào nghiêm ngặt.

---

### Bảo mật Multi-tenant (Đa người thuê)

- **Cách ly dữ liệu (Tenant Isolation)**: Sử dụng cơ chế Row Level Security (RLS) ở tầng Database để đảm bảo dữ liệu của tenant này không bị truy cập bởi tenant khác.
- **Ngữ cảnh Tenant (Tenant Context)**: Mỗi yêu cầu API phải đi kèm định danh tenant (Tenant ID) để hệ thống áp dụng các quy tắc cách ly tương ứng.

---

### Bảo mật API và Hạ tầng

- **Rate Limiting**: Giới hạn số lượng yêu cầu từ một IP/Người dùng để chống tấn công từ chối dịch vụ (DoS) và bẻ khóa mật khẩu (Brute-force).
- **Bảo mật Webhook**: Kiểm tra chữ ký (Signature) của mọi webhook gửi đến để xác minh nguồn tin cậy.
- **Bảo mật Container (Docker)**: Sử dụng các image tối giản, chạy ứng dụng với quyền user thường (không dùng root) và quét lỗ hổng định kỳ.
- **Bảo mật mạng (Network Security)**: Sử dụng Network Policies trong Kubernetes để giới hạn giao tiếp giữa các dịch vụ chỉ ở mức cần thiết.

---

### Giám sát và Kiểm toán

- **Ghi nhật ký bảo mật**: Lưu trữ vết về đăng nhập lỗi, các thay đổi quyền hạn, và truy cập dữ liệu nhạy cảm.
- **Phát hiện đe dọa**: Tự động nhận diện các hành vi bất thường (ví dụ: đăng nhập từ nhiều quốc gia khác nhau trong thời gian ngắn).

---

### Phê duyệt

**Trưởng nhóm Bảo mật**: ********\_\_\_********  
**Kiến trúc sư hệ thống**: ********\_\_\_********  
**Giám đốc An ninh Thông tin (CISO)**: ********\_\_\_********
