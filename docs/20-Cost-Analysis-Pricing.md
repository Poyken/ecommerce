# Phân tích Chi phí & Mô hình Giá cả

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Tài chính  
**Trạng thái**: Bản nháp

---

### Tổng quan về Chi phí

#### Phân loại chi phí chính

1. **Chi phí Phát triển (Development Costs)**: Bao gồm lương đội ngũ kỹ thuật, chi phí bản quyền công cụ dev, hạ tầng môi trường test.
2. **Chi phí Vận hành (Operational Costs)**: Hạ tầng Cloud (AWS/Azure), các dịch vụ bên thứ ba (Stripe, SendGrid), giám sát và bảo trì 24/7.
3. **Chi phí Marketing & Sales**: Quảng cáo, lương đội ngũ kinh doanh, hỗ trợ khách hàng.
4. **Chi phí Quản lý (Administrative)**: Pháp lý, thuế, văn phòng và các chi phí hành chính khác.

---

### Cơ cấu Chi phí Vận hành (Cloud & Dịch vụ)

| Thành phần         | Dịch vụ             | Ước tính hàng tháng | Ghi chú                                          |
| ------------------ | ------------------- | ------------------- | ------------------------------------------------ |
| **Server/Compute** | AWS EC2 / Fargate   | $400 - $800         | Phụ thuộc vào số lượng tenant và lưu lượng.      |
| **Database**       | AWS RDS (Postgres)  | $200 - $400         | Đã bao gồm chi phí sao lưu và High Availability. |
| **Lưu trữ**        | AWS S3 + CloudFront | $50 - $150          | Lưu trữ hình ảnh sản phẩm và CDN.                |
| **Thanh toán**     | Stripe / PayPal     | 2.9% + $0.30/gd     | Phí thu trên từng giao dịch thành công.          |
| **Email/SMS**      | SendGrid / Twilio   | $50 - $100          | Thông báo đơn hàng và OTP.                       |

---

### Mô hình Giá cả (Pricing Model)

Chúng tôi áp dụng mô hình giá thuê bao hằng tháng (SaaS) kết hợp với phí dựa trên mức độ sử dụng (Usage-based).

#### Các gói dịch vụ (Tiers)

1. **Gói Starter ($29/tháng)**:
   - Phù hợp cho hộ kinh doanh nhỏ.
   - Giới hạn 100 sản phẩm, 500 đơn hàng/tháng.
   - Hỗ trợ thanh toán cơ bản.
2. **Gói Professional ($99/tháng)**:
   - Phù hợp cho doanh nghiệp đang tăng trưởng.
   - Giới hạn 1,000 sản phẩm, 5,000 đơn hàng/tháng.
   - Hỗ trợ đa cổng thanh toán, quản lý kho nâng cao.
   - Có API truy cập và tích hợp vận chuyển.
3. **Gói Enterprise ($299/tháng)**:
   - Phù hợp cho doanh nghiệp lớn hoặc chuỗi cửa hàng.
   - Không giới hạn sản phẩm và đơn hàng.
   - Hỗ trợ tùy chỉnh giao diện (White-label), hỗ trợ 24/7 từ chuyên gia.
   - Cam kết mức độ sẵn sàng (SLA) 99.9%.

#### Phí bổ sung (Add-ons)

- Dung lượng lưu trữ thêm: $0.50/GB.
- Băng thông vượt mức: $0.10/GB.
- Tin nhắn SMS OTP: Theo bảng giá nhà mạng.

---

### Dự kiến Điểm hòa vốn (Break-even Analysis)

Dựa trên tổng chi phí cố định hằng tháng, chúng tôi dự kiến đạt điểm hòa vốn khi hệ thống có **150 - 200 khách hàng** sử dụng gói Professional hoặc tương đương.

---

### Phê duyệt

**Trưởng phòng Tài chính**: ********\_\_\_********  
**Giám đốc Kinh doanh (CCO)**: ********\_\_\_********  
**Tổng Giám đốc (CEO)**: ********\_\_\_********
