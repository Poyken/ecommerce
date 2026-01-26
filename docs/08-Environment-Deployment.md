# Môi trường & Triển khai

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ DevOps  
**Trạng thái**: Bản nháp

---

### Tổng quan Môi trường

#### Chiến lược Môi trường

1. **Cách ly Môi trường**: Các môi trường (Dev, Staging, Prod) hoàn toàn tách biệt.
2. **Hạ tầng dưới dạng mã (IaC)**: Quản lý hạ tầng thông qua mã nguồn (Terraform).
3. **Triển khai Tự động**: Hệ thống CI/CD tự động hóa quy trình build và deploy.
4. **Zero Downtime**: Triển khai không gây gián đoạn dịch vụ (Blue-Green hoặc Rolling Update).
5. **Bảo mật hàng đầu**: Áp dụng các tiêu chuẩn bảo mật ngay từ khâu thiết lập.

#### Các loại Môi trường

| Môi trường      | Mục đích                  | Hạ tầng               | Dữ liệu                           | Giám sát                   |
| --------------- | ------------------------- | --------------------- | --------------------------------- | -------------------------- |
| **Development** | Phát triển nội bộ         | Docker Compose        | Dữ liệu mẫu (Seed)                | Logging cơ bản             |
| **Staging**     | Kiểm thử trước khi ra mắt | Cloud (Render)        | Bản sao dữ liệu Prod (đã ẩn danh) | Đầy đủ monitoring          |
| **Production**  | Môi trường thực tế        | Cloud (Render/Vercel) | Dữ liệu thực                      | Full monitoring + Cảnh báo |

---

### Thiết lập Phát triển tại địa phương (Local)

#### Yêu cầu tiên quyết

- **Node.js**: >= 20.0.0
- **Docker & Docker Compose**: Phiên bản mới nhất.
- **Git**: Để quản lý mã nguồn.

#### Khởi động nhanh

1. Clone repository.
2. Sao chép và cấu hình file `.env` từ file mẫu.
3. Chạy `docker-compose up -d` để khởi động DB, Redis, v.v.
4. Cài đặt dependencies: `npm install`.
5. Chạy migration và seed dữ liệu.
6. Khởi động server API và Web.

---

### Quy trình CI/CD

#### GitHub Actions Workflow

- **Lint & Test**: Tự động chạy kiểm tra định dạng và unit test trên mỗi PR.
- **Security Scan**: Quét lỗ hổng bảo mật trong mã nguồn và thư viện.
- **Build & Push**: Xây dựng Docker image và đẩy lên registry.
- **Deploy**: Tự động triển khai lên Staging (nhánh `develop`) hoặc Production (nhánh `main`).

---

### Giám sát và Lưu nhật ký (Monitoring & Logging)

- **Ứng dụng**: Sử dụng Prometheus để thu thập metrics và Grafana để hiển thị Dashboard.
- **Logging**: Sử dụng winston/pino cho backend, gửi logs về hệ thống tập trung (như ELK hoặc Sentry).
- **Health Checks**: Các endpoint `/health`, `/health/ready` để kiểm tra tình trạng kết nối DB, Redis.

---

### Sao lưu và Khôi phục sau thảm họa (Backup & DR)

- **Chiến lược Sao lưu DB**: Tự động hằng ngày, lưu trữ trên S3 với chính sách xoay vòng 30 ngày.
- **Kế hoạch DR**:
  - **RTO (Thời gian khôi phục)**: < 4 giờ.
  - **RPO (Mất mát dữ liệu tối đa)**: < 1 giờ.
  - Các kịch bản: Lỗi Database, Lỗi Region Cloud, Lỗi dữ liệu.

---

### Bảo mật và Tuân thủ

- **Tối ưu Bảo mật (Hardening)**:
  - Sử dụng Helmet cho các security headers.
  - Giới hạn tần suất yêu cầu (Rate Limiting).
  - Xác thực đầu vào và chống XSS/SQL Injection.
- **Tuân thủ GDPR**: Dịch vụ ẩn danh hóa người dùng và xuất dữ liệu cá nhân.
- **Tuân thủ PCI-DSS**: Quy trình xử lý dữ liệu thanh toán an toàn, không lưu trữ thông tin nhạy cảm của thẻ trực tiếp.

---

### Tối ưu hóa Chi phí

- **Tối ưu tài nguyên**: Điều chỉnh kích thước các instance dựa trên thực tế sử dụng.
- **Tự động hóa**: Tắt các tài nguyên không cần thiết ở môi trường Dev/Staging ngoài giờ làm việc.
- **Giám sát chi phí**: Cảnh báo khi ngân sách vượt mức quy định.

---

### Phê duyệt

**Trưởng nhóm DevOps**: ********\_\_\_********  
**Cán bộ Bảo mật**: ********\_\_\_********  
**Cán bộ Tuân thủ**: ********\_\_\_********  
**Quản lý Hạ tầng**: ********\_\_\_********
