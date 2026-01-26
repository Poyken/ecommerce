# Chiến lược Giám sát & Cảnh báo

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ DevOps  
**Trạng thái**: Bản nháp

---

### Triết lý Giám sát

#### Nguyên tắc cốt lõi

1. **Giám sát Chủ động**: Phát hiện vấn đề trước khi chúng ảnh hưởng đến trải nghiệm người dùng.
2. **Hiển thị Toàn diện (Full Stack)**: Theo dõi từ hạ tầng (server, network) đến lớp ứng dụng và database.
3. **Phân tách theo Tenant**: Khả năng theo dõi hiệu suất của từng gian hàng (tenant) cũng như toàn bộ hệ thống.
4. **Chỉ số Kinh doanh (Business Metrics)**: Không chỉ giám sát kỹ thuật, mà còn theo dõi các KPI kinh doanh như số lượng đơn hàng, doanh thu.
5. **Phản ứng Tự động**: Tích hợp các cơ chế tự động xử lý khi phát hiện lỗi (ví dụ: tự động khởi động lại dịch vụ).

#### Mục tiêu Giám sát

- **Uptime 99.9%**: Đảm bảo hệ thống luôn sẵn sàng phục vụ.
- **Tải trang < 2s**: Duy trì trải nghiệm người dùng mượt mà.
- **Phản hồi API < 500ms**: Tối ưu hóa hiệu năng backend.
- **Phát hiện sự cố thời gian thực**: Nhận biết lỗi trong vòng vài giây.

---

### Kiến trúc Hệ thống Giám sát

| Thành phần             | Công nghệ          | Mục đích                                                                    |
| ---------------------- | ------------------ | --------------------------------------------------------------------------- |
| **Thu thập chỉ số**    | Prometheus         | Lưu trữ các chỉ số theo chuỗi thời gian (Time-series data).                 |
| **Trực quan hóa**      | Grafana            | Xây dựng các Dashboard hiển thị biểu đồ.                                    |
| **Quản lý Log**        | ELK Stack          | Thu tập, xử lý và tìm kiếm log tập trung (Elasticsearch, Logstash, Kibana). |
| **Theo dõi hiệu năng** | Sentry / New Relic | Theo dõi lỗi ứng dụng (APM) và vết lỗi (Stack trace).                       |
| **Cảnh báo**           | Alertmanager       | Phân loại và gửi thông báo lỗi qua Slack, Email, SMS.                       |

---

### Các chỉ số quan trọng (Key Metrics)

- **Chỉ số Ứng dụng**: Số lượng yêu cầu (Request count), Tỷ lệ lỗi (Error rate), Thời gian phản hồi (Latency).
- **Chỉ số Kinh doanh**: Tổng đơn hàng, Doanh thu theo thời gian thực, Tỷ lệ bỏ giỏ hàng.
- **Chỉ số Hạ tầng**: Tỷ lệ sử dụng CPU, RAM, dung lượng Disk, lưu lượng Network.
- **Chỉ số Database**: Số lượng kết nối đang mở, các truy vấn chậm (Slow queries), tỷ lệ Cache hit.

---

### Chiến lược Ghi log (Logging)

- **Cấu trúc Log**: Mọi bản ghi log đều sử dụng định dạng JSON để dễ dàng tìm kiếm và phân tích.
- **Thông tin bối cảnh**: Mỗi dòng log phải đi kèm với `requestId`, `tenantId`, `userId` để phục vụ việc truy vết (Tracing).
- **Phân loại**: Chia log theo các mức độ (levels): `INFO` (thông tin), `WARN` (cảnh báo), `ERROR` (lỗi nghiêm trọng).

---

### Chiến lược Cảnh báo (Alerting)

- **Mức độ Nghiêm trọng (Critical)**: Hệ thống ngừng hoạt động, tỷ lệ lỗi > 5%. Gửi thông báo ngay lập tức qua mọi kênh (Sms, Slack, Email).
- **Mức độ Cảnh báo (Warning)**: Hiệu năng giảm, tài nguyên sắp hết (CPU > 80%). Thông báo qua Slack/Email để đội ngũ kỹ thuật xử lý trong khung giờ làm việc.
- **Phân luồng**: Cảnh báo kỹ thuật gửi cho đội DevOps, cảnh báo kinh doanh gửi cho đội vận hành.

---

### Phê duyệt

**Trưởng nhóm DevOps**: ********\_\_\_********  
**Kiến trúc sư hệ thống**: ********\_\_\_********  
**Quản lý Vận hành**: ********\_\_\_********
