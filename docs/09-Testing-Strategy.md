# Chiến lược Testing

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ QA  
**Trạng thái**: Bản nháp

---

### Triết lý Testing

#### Nguyên tắc Testing

1. **Test sớm, Test thường xuyên**: Bắt đầu từ những giai đoạn đầu của dự án.
2. **Ưu tiên Tự động hóa**: Xây dựng hệ thống automated testing để giảm thiểu sai sót do con người.
3. **Kiểm thử Multi-tenant**: Đặc biệt chú trọng vào việc cách ly dữ liệu và bảo mật giữa các tenant.
4. **Kiểm thử Hiệu năng**: Đảm bảo hệ thống vẫn mượt mà khi lượng truy cập lớn.
5. **Lấy người dùng làm trung tâm**: Tập trung vào các kịch bản thực tế mà người dùng sẽ trải qua.

#### Mục tiêu Testing (KPIs)

- **Độ bao phủ mã nguồn (Code Coverage)**: > 80% cho các logic nghiệp vụ quan trọng.
- **Phát hiện lỗi**: Ít nhất 95% lỗi được phát hiện trước khi đưa lên môi trường Production.
- **Hiệu năng**: Thời gian phản hồi API < 500ms dưới tải trọng bình thường.
- **Bảo mật**: Không có lỗ hổng bảo mật mức độ Nghiêm trọng.

---

### Mô hình Kim tự tháp Testing

1. **Unit Tests (70%)**: Kiểm tra các logic nhỏ nhất (hàm, class). Sử dụng Jest (Backend) và Vitest (Frontend).
2. **Integration Tests (20%)**: Kiểm tra sự tương tác giữa các module, API và Database.
3. **E2E Tests (10%)**: Kiểm tra toàn bộ luồng người dùng trên giao diện thực tế. Sử dụng Playwright.

---

### Các cấp độ Testing chi tiết

#### 1. Unit Testing

- Tập trung vào: Logic nghiệp vụ, các hàm tiện ích, validation, xử lý lỗi.
- Yêu cầu: Độc lập hoàn toàn (sử dụng Mock cho các phụ thuộc bên ngoài).

#### 2. Integration Testing

- Tập trung vào:
  - API Endpoints (Xác thực dữ liệu đầu vào, mã trạng thái phản hồi).
  - Tương tác Database (Migration, Integrity, Transactions).
  - Tích hợp dịch vụ bên thứ ba (Cổng thanh toán, Email, SMS).

#### 3. End-to-End (E2E) Testing

- Các kịch bản trọng yếu:
  - Hành trình mua hàng: Tìm kiếm -> Giỏ hàng -> Thanh toán -> Theo dõi đơn hàng.
  - Quản trị Dashboard: Quản lý sản phẩm, đơn hàng, khách hàng.
  - Vận hành Multi-tenant: Đảm bảo Tenant A không thể thấy dữ liệu của Tenant B.

---

### Kiểm thử Hiệu năng & Bảo mật

#### Kiểm thử Hiệu năng

- **Load Testing**: Giả lập lượng người dùng tăng dần để kiểm tra thời gian phản hồi.
- **Stress Testing**: Xác định giới hạn chịu tải tối đa của hệ thống trước khi xảy ra lỗi.
- **Scalability Testing**: Kiểm tra khả năng tự động mở rộng (Scaling) của hạ tầng.

#### Kiểm thử Bảo mật

- **SAST**: Quét mã nguồn để tìm lỗ hổng bảo mật.
- **DAST**: Kiểm thử xâm nhập trên ứng dụng đang chạy (OWASP Top 10).
- **Phòng chống Brute Force**: Kiểm tra cơ chế khóa tài khoản khi đăng nhập sai nhiều lần.

---

### Quản lý Dữ liệu Kiểm thử (Test Data)

- Sử dụng **Factory Pattern** để tạo dữ liệu mẫu nhanh chóng và nhất quán.
- Dữ liệu nhạy cảm (như thông tin thanh toán) phải được Mock hoàn toàn.
- Database kiểm thử cần được dọn dẹp sạch (Truncate) sau mỗi phiên chạy test.

---

### Quy trình Tự động hóa (Test Automation in CI/CD)

- **PR Check**: Chạy Unit test và Linting ngay khi có Pull Request mới.
- **Integration Check**: Chạy test tích hợp trước khi merge vào nhánh `develop`.
- **Pre-release Check**: Chạy toàn bộ E2E suite và Security scan trước khi release.

---

### Phê duyệt

**Trưởng nhóm QA**: ********\_\_\_********  
**Kiến trúc sư Testing**: ********\_\_\_********  
**Trưởng nhóm DevOps**: ********\_\_\_********
