# Kế hoạch Kiểm thử Hiệu suất & Benchmarking

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Performance Testing  
**Trạng thái**: Bản nháp

---

### Tổng quan về Kiểm thử Hiệu suất

#### Triết lý kiểm thử

1. **Hiệu suất là ưu tiên (Performance First)**: Hiệu suất không phải là một tùy chọn, nó là một tính năng cốt lõi.
2. **Lấy người dùng làm trung tâm**: Các bài test phải phản ánh đúng hành thực tế của người dùng.
3. **Phân tách Đa người thuê (Multi-tenant)**: Đảm bảo hiệu suất ổn định cho tất cả các tenant cùng lúc.
4. **Kiểm thử liên tục**: Tích hợp kiểm tra hiệu suất vào luồng CI/CD.
5. **Dựa trên dữ liệu**: Mọi quyết định tối ưu phải dựa trên kết quả đo lường cụ thể.

#### Mục tiêu Hiệu suất (KPIs)

| Chỉ số                     | Mục tiêu            | Giải thích                                                  |
| -------------------------- | ------------------- | ----------------------------------------------------------- |
| **Thời gian phản hồi API** | < 500ms (p95)       | 95% yêu cầu API phải hoàn thành trong 0.5 giây.             |
| **Thời gian tải trang**    | < 2 giây            | Thời gian trung bình để người dùng thấy nội dung trang web. |
| **Lưu lượng xử lý**        | 1,000 đơn hàng/phút | Công suất xử lý giao dịch đồng thời của hệ thống.           |
| **Người dùng đồng thời**   | 10,000 users        | Số lượng kết nối duy trì ổn định không gây lỗi.             |

---

### Các loại hình Kiểm thử

1. **Kiểm thử Tải (Load Testing)**: Kiểm tra khả năng hoạt động của hệ thống dưới mức tải dự kiến thông thường.
2. **Kiểm thử Căng thẳng (Stress Testing)**: Đẩy hệ thống đến giới hạn tối đa để xác định điểm gãy và khả năng phục hồi.
3. **Kiểm thử Độ bền (Endurance Testing)**: Duy trì mức tải trung bình trong thời gian dài (ví dụ: 8-24 giờ) để phát hiện rò rỉ bộ nhớ hoặc lỗi tài nguyên.
4. **Benchmarking**: So sánh hiệu suất của mã nguồn mới so với các phiên bản trước đó hoặc so với tiêu chuẩn ngành.

---

### Kịch bản Nghiệp vụ (Business Scenarios)

- **Luồng mua sắm**: Người dùng vào trang chủ -> Tìm kiếm sản phẩm -> Xem chi tiết -> Thêm vào giỏ hàng -> Thanh toán.
- **Quản trị gian hàng**: Admin đăng tải sản phẩm mới -> Cập nhật kho hàng -> Xem báo cáo doanh thu.
- **Đa gian hàng**: Giả lập hàng trăm tenant cùng thực hiện các chiến dịch khuyến mãi cùng lúc để kiểm tra sự ổn định của hạ tầng dùng chung.

---

### Kiểm thử Hiệu suất Database

- **Truy vấn chậm (Slow Queries)**: Sử dụng `EXPLAIN ANALYZE` để tối ưu các câu lệnh SQL phức tạp.
- **Connection Pooling**: Đảm bảo số lượng kết nối đồng thời đến DB được quản lý hiệu quả qua PgBouncer hoặc thư viện pool.
- **Tenant Isolation**: Đo lường sự khác biệt về hiệu suất khi truy vấn dữ liệu của các tenant có quy mô lớn nhỏ khác nhau.

---

### Công cụ sử dụng

- **K6**: Công cụ chính để viết kịch bản và chạy các bài test hiệu suất API.
- **Lighthouse**: Kiểm tra chỉ số Core Web Vitals (LCP, FID, CLS) của Frontend.
- **Prometheus & Grafana**: Thu thập và trực quan hóa các chỉ số tài nguyên (CPU, RAM) trong suốt quá trình test.

---

### Phê duyệt

**Trưởng nhóm Kiểm thử**: ********\_\_\_********  
**Kiến trúc sư hệ thống**: ********\_\_\_********  
**Quản lý dự án**: ********\_\_\_********
