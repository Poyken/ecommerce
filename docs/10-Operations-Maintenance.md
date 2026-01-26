# Vận hành & Bảo trì

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Vận hành  
**Trạng thái**: Bản nháp

---

### Triết lý Vận hành

#### Nguyên tắc Vận hành

1. **Giám sát Chủ động**: Phát hiện vấn đề trước khi người dùng kịp nhận thấy.
2. **Phản ứng Tự động**: Ưu tiên các cơ chế tự phục hồi (Self-healing).
3. **Cải tiến Liên tục**: Luôn rà soát và tối ưu quy trình sau mỗi sự cố.
4. **Tài liệu là ưu tiên**: Mọi quy trình vận hành đều phải được văn bản hóa (Runbooks).
5. **An ninh là cốt lõi**: Không đánh đổi bảo mật lấy sự tiện lợi nhất thời.

#### Mục tiêu Vận hành (SLA)

- **Uptime**: Mục tiêu đạt 99.9% khả năng đáp ứng dịch vụ.
- **Thời gian phản hồi**: < 5 phút cho các cảnh báo nghiêm trọng.
- **Thời gian xử lý**: < 1 giờ cho các sự cố ưu tiên cao (P0).

---

### Giám sát và Cảnh báo (Monitoring & Alerting)

#### Hệ thống sử dụng

- **Hạ tầng**: Prometheus & Grafana để thu thập và hiển thị chỉ số CPU, RAM, Disk, Network.
- **Ứng dụng**: Sentry theo dõi lỗi code, New Relic theo dõi hiệu năng hệ thống (APM).
- **Kinh doanh**: Dashboard theo dõi số lượng đơn hàng, doanh thu theo thời gian thực.

#### Quy tắc Cảnh báo

- **Nghiêm trọng (Critical)**: Dịch vụ ngừng hoạt động, tỷ lệ lỗi > 5%, mất kết nối Database. Gửi thông báo qua SMS, Slack và Email ngay lập tức.
- **Cảnh báo (Warning)**: CPU/RAM > 80%, thời gian truy vấn DB chậm, dung lượng ổ đĩa sắp hết. Thông báo qua Slack/Email.

---

### Quy trình Ứng phó Sự cố (Incident Response)

#### Phân loại mức độ nghiêm trọng

- **P0 - Khẩn cấp**: Toàn bộ hệ thống ngừng hoạt động, ảnh hưởng trực tiếp đến doanh thu.
- **P1 - Cao**: Một tính năng quan trọng bị lỗi (ví dụ: không thể thanh toán), ảnh hưởng đến nhiều người dùng.
- **P2 - Trung bình**: Tính năng phụ bị lỗi hoặc hiệu năng bị giảm sút nhẹ.
- **P3 - Thấp**: Lỗi giao diện, các vấn đề nhỏ không ảnh hưởng đến luồng nghiệp vụ chính.

#### Đội ngũ On-call

- Luôn có kỹ sư trực 24/7 để tiếp nhận cảnh báo P0/P1.
- Quy trình leo thang: Nếu kỹ sư trực không xử lý được trong 15 phút, yêu cầu sự hỗ trợ từ Tech Lead hoặc DevOps Manager.

---

### Bảo trì Hệ thống

#### Lịch bảo trì định kỳ

- **Hằng tuần**: Cập nhật các bản vá bảo mật (Security Patches).
- **Hằng tháng**: Tối ưu hóa Database (Rebuild indexes, Vacuum).
- **Hằng quý**: Kiểm tra khả năng khôi phục từ bản sao lưu (Backup restoration test).

#### Quy trình cập nhật bản vá

1. Đánh giá mức độ ảnh hưởng của bản vá.
2. Kiểm thử trên môi trường Staging.
3. Lên kế hoạch triển khai vào khung giờ thấp điểm.
4. Thông báo cho người dùng (nếu cần thiết).
5. Thực hiện cập nhật và kiểm tra lại hệ thống (Health Check).

---

### Tối ưu hóa Hiệu năng

- **Database**: Xác định các truy vấn chậm (Slow queries) và thêm Index hoặc tối ưu lại logic.
- **Caching**: Sử dụng Redis để lưu trữ kết quả của các tính toán phức tạp hoặc dữ liệu thường xuyên truy cập nhưng ít thay đổi.
- **Auto-scaling**: Tự động tăng/giảm số lượng server (Pods) dựa trên lưu lượng truy cập thực tế.

---

### Quản trị Tri thức (Knowledge Management)

- **Runbooks**: Tài liệu hướng dẫn từng bước xử lý các lỗi thường gặp.
- **Post-mortems**: Báo cáo phân tích nguyên nhân gốc rễ (Root Cause Analysis) sau mỗi sự cố lớn để tránh lặp lại lỗi tương tự trong tương lai.

---

### Phê duyệt

**Quản lý Vận hành**: ********\_\_\_********  
**Trưởng nhóm SRE**: ********\_\_\_********  
**Cán bộ Bảo mật**: ********\_\_\_********
