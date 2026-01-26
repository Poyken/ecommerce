# Quản lý Rủi ro & Tuân thủ

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Quản lý Rủi ro  
**Trạng thái**: Bản nháp

---

### Triết lý Quản lý Rủi ro

#### Nguyên tắc cốt lõi

1. **Xác định Chủ động**: Tìm kiếm rủi ro trước khi chúng trở thành sự cố.
2. **Tiếp cận dựa trên Rủi ro**: Ưu tiên xử lý các rủi ro có tác động lớn nhất.
3. **Giám sát liên tục**: Hệ thống không bao giờ ngủ, giám sát 24/7.
4. **Minh bạch**: Mọi rủi ro và phương án ứng phó đều được công khai trong nội bộ.
5. **Ưu tiên Tuân thủ**: Luôn tuân thủ các quy định pháp luật và tiêu chuẩn ngành.

#### Khẩu vị Rủi ro (Risk Appetite)

- **Rủi ro Chiến lược**: Chấp nhận ở mức trung bình (đổi mới để tăng trưởng).
- **Rủi ro Vận hành**: Thấp (đảm bảo tính ổn định cao nhất).
- **Rủi ro Tuân thủ**: KHÔNG chấp nhận (phải tuân thủ tuyệt đối).
- **Rủi ro Bảo mật**: Rất thấp (bảo vệ dữ liệu khách hàng là trên hết).

---

### Quản lý Rủi ro Bảo mật

#### Các rủi ro chính

- **Rò rỉ dữ liệu**: Truy cập trái phép thông tin khách hàng.
- **Tấn công DDoS**: Làm gián đoạn dịch vụ do quá tải lưu lượng.
- **Tấn công Injection (SQLi, XSS)**: Chèn mã độc vào ứng dụng.
- **Rủi ro từ bên thứ ba**: Lỗ hổng từ các thư viện hoặc dịch vụ tích hợp.

#### Biện pháp kiểm soát Kỹ thuật

- **Headers Bảo mật**: Sử dụng Helmet để cấu hình CSP, HSTS.
- **Giới hạn yêu cầu (Rate Limiting)**: Chống brute-force và spam.
- **Mã hóa**: Mã hóa dữ liệu nhạy cảm ở trạng thái nghỉ và khi đang truyền tải.
- **Phân quyền (RBAC)**: Chỉ cấp quyền tối thiểu cần thiết cho từng vai trò người dùng.

---

### Quản lý Tuân thủ (Compliance)

#### Các quy định áp dụng

- **GDPR**: Dành cho dữ liệu khách hàng EU (Bảo mật, quyền được quên, đồng ý của người dùng).
- **PCI DSS**: Tiêu chuẩn bảo mật dữ liệu thẻ thanh toán.
- **Quy định địa phương**: Các luật về thương mại điện tử và bảo vệ dữ liệu cá nhân tại Việt Nam.

#### Triển khai quyền của chủ thể dữ liệu

- **Quyền truy cập**: Khách hàng có thể xuất toàn bộ dữ liệu cá nhân của mình.
- **Quyền được chỉnh sửa**: Cho phép người dùng cập nhật thông tin chính xác.
- **Quyền được xóa (Quyền được quên)**: Xóa hoặc ẩn danh hóa dữ liệu người dùng khi có yêu cầu hợp lệ.

---

### Kế hoạch Duy trì Hoạt động (BCP)

#### Phân tích tác động kinh doanh (BIA)

- **Xử lý đơn hàng**: Rất quan trọng. Mục tiêu khôi phục (RTO) trong 1 giờ.
- **Thanh toán**: Rất quan trọng. RTO trong 30 phút.
- **Danh mục sản phẩm**: Quan trọng. RTO trong 4 giờ.

#### Quy trình Phản ứng sự cố

1. **Phát hiện**: Nhận cảnh báo từ hệ thống giám sát.
2. **Đánh giá**: Xác định mức độ ảnh hưởng và huy động nguồn lực.
3. **Phản ứng**: Thực hiện các biện pháp ngăn chặn và khôi phục.
4. **Hậu sự cố**: Phân tích nguyên nhân gốc rễ và cải thiện quy trình.

---

### Quản lý Rủi ro từ Bên thứ ba

- **Đánh giá nhà cung cấp**: Kiểm tra các chứng chỉ bảo mật (SOC2, ISO27001) trước khi hợp tác.
- **Ràng buộc Hợp đồng**: Các điều khoản về bảo mật dữ liệu và thông báo sự cố trong vòng 24 giờ.
- **Giám sát định kỳ**: Rà soát lại rủi ro từ các đối tác hằng năm.

---

### Phê duyệt

**Trạm trưởng Quản lý Rủi ro**: ********\_\_\_********  
**Giám đốc An ninh Thông tin (CISO)**: ********\_\_\_********  
**Cán bộ Pháp lý**: ********\_\_\_********
