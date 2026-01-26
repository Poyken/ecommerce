# Quản lý Rủi ro

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Quản lý Rủi ro  
**Trạng thái**: Bản nháp

---

### Tổng quan về Quản lý Rủi ro

#### Khung quản lý Rủi ro (Framework)

1. **Xác định Rủi ro**: Nhận diện các mối đe dọa tiềm ẩn.
2. **Đánh giá Rủi ro**: Phân tích mức độ tác động và xác suất xảy ra.
3. **Giảm thiểu Rủi ro**: Triển khai các biện pháp ngăn chặn hoặc ứng phó.
4. **Giám sát Rủi ro**: Theo dõi liên tục và cập nhật trạng thái.
5. **Đánh giá định kỳ**: Xem xét lại hiệu quả của các biện pháp đã thực hiện.

#### Phân loại Rủi ro

- **Kỹ thuật**: Hiệu năng, Khả năng mở rộng, Tích hợp, Nợ kỹ thuật.
- **Kinh doanh**: Sự chấp nhận của thị trường, Thiếu hụt doanh thu, Cạnh tranh, Tỷ lệ khách hàng rời bỏ.
- **Vận hành**: Biến động nhân sự, Hạn chế nguồn lực, Quy trình chưa tối ưu, Phụ thuộc nhà cung cấp.
- **An ninh**: Rò rỉ dữ liệu, Lỗ hổng hệ thống, Vi phạm tuân thủ.
- **Pháp lý**: Thay đổi quy định pháp luật, Vi phạm bản quyền, Tranh chấp hợp đồng.

---

### Ma trận Rủi ro (Trích lược)

#### Rủi ro Kỹ thuật

| Rủi ro                   | Mức độ     | Xác suất   | Tác động                           | Biện pháp giảm thiểu                                          | Người chịu trách nhiệm |
| ------------------------ | ---------- | ---------- | ---------------------------------- | ------------------------------------------------------------- | ---------------------- |
| **Hiệu năng Database**   | Cao        | Trung bình | Hệ thống chậm, mất khách hàng      | Tối ưu truy vấn, bản sao đọc (read replicas), caching         | Tech Lead              |
| **Bảo mật Multi-tenant** | Cao        | Thấp       | Rò rỉ dữ liệu, trách nhiệm pháp lý | Row-level security, kiểm toán định kỳ, kiểm thử xâm nhập      | Security Engineer      |
| **Lỗi API bên thứ 3**    | Trung bình | Cao        | Tính năng bị gián đoạn             | Sử dụng nhiều nhà cung cấp, cơ chế dự phòng, circuit breakers | Backend Lead           |

#### Rủi ro Kinh doanh

| Rủi ro                      | Mức độ     | Xác suất   | Tác động            | Biện pháp giảm thiểu                                          | Người chịu trách nhiệm |
| --------------------------- | ---------- | ---------- | ------------------- | ------------------------------------------------------------- | ---------------------- |
| **Tốc độ tăng trưởng chậm** | Cao        | Trung bình | Thiếu hụt doanh thu | Chiến dịch marketing, điều chỉnh giá, chương trình giới thiệu | Product Manager        |
| **Áp lực Cạnh tranh**       | Trung bình | Cao        | Mất thị phần        | Tạo sự khác biệt cho sản phẩm, đổi mới liên tục               | CEO                    |

---

### Kế hoạch mitigation và Giám sát

- **Giám sát Hiệu năng**: Tự động theo dõi các ngưỡng (Thresholds) về thời gian truy vấn, CPU, Ram. Nếu vượt ngưỡng sẽ gửi cảnh báo tức thì.
- **Bảo mật Tenant**: Kiểm tra định kỳ khả năng cách ly dữ liệu giữa các tenant, đảm bảo không có rò rỉ chéo.
- **Theo dỗi chỉ số Kinh doanh**: Giám sát chi phí thu hút khách hàng (CAC), tỷ lệ chuyển đổi và tỷ lệ rời bỏ để có điều chỉnh kịp thời về mặt thương mại.

---

### Quy trình Ứng phó Sự cố (Incident Response)

1. **Phát hiện**: Thông qua hệ thống giám sát hoặc báo cáo từ người dùng/nhân viên.
2. **Đánh giá**: Xác định mức độ nghiêm trọng (Thấp, Trung bình, Cao, Nghiêm trọng).
3. **Phản ứng**: Kích hoạt đội ngũ ứng phó, thực hiện các biện pháp ngăn chặn tạm thời.
4. **Khôi phục**: Khắc phục triệt để nguyên nhân, khôi phục dữ liệu/dịch vụ.
5. **Hậu sự cố**: Họp đánh giá rút kinh nghiệm, cập nhật tài liệu rủi ro.

---

### Quản trị Rủi ro (Governance)

- **Hội đồng Rủi ro**: Bao gồm CEO, CTO, CFO và các trưởng bộ phận liên quan. Họp định kỳ hằng tháng.
- **Tuyên bố về Khẩu vị Rủi ro**: Xác định rõ những rủi ro nào công ty chấp nhận (như đổi mới công nghệ) và những rủi ro nào không được phép xảy ra (vi phạm dữ liệu khách hàng).

---

### Phê duyệt

**Trưởng nhóm Quản lý Rủi ro**: ********\_\_\_********  
**CEO**: ********\_\_\_********  
**Hội đồng Quản trị**: ********\_\_\_********
