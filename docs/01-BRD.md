# Tài liệu Yêu cầu Kinh doanh (BRD)

## Nền tảng E-commerce Multi-tenant

---

### Tóm tắt Điều hành

**Tên dự án**: Nền tảng E-commerce 2.0 Multi-tenant  
**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Phát triển

Tài liệu này vạch ra các yêu cầu kinh doanh cho một nền tảng e-commerce toàn diện cho phép nhiều tenants (cửa hàng) hoạt động độc lập trên cơ sở hạ tầng chia sẻ. Nền tảng sẽ phục vụ các mô hình kinh doanh B2C, B2B và B2B2C với các tính năng nâng cao bao gồm tìm kiếm được hỗ trợ bởi AI, tồn kho đa kho và phân tích toàn diện.

---

### Tuyên bố Vấn đề Kinh doanh

#### Khoảng trống Thị trường Hiện tại

- Các giải pháp e-commerce hiện tại hoặc là single-tenant hoặc quá đắt đối với doanh nghiệp nhỏ
- Các nền tảng multi-tenant thiếu khả năng tùy chỉnh và tính năng nâng cao
- Không có giải pháp thống nhất hỗ trợ cả mô hình B2C và B2B với quản lý tồn kho phù hợp
- Tích hợp AI và phân tích thời gian thực hạn chế trong các giải pháp hiện tại

#### Cơ hội Kinh doanh

- Đáp ứng thị trường SMB đang phát triển cần e-commerce giá cả phải chăng, giàu tính năng
- Cung cấp các tính năng cấp doanh nghiệp với giá SaaS
- Cho phép thâm nhập thị trường nhanh chóng cho các doanh nghiệp mới với chi phí kỹ thuật tối thiểu
- Tạo nền tảng có thể mở rộng phát triển cùng với nhu cầu kinh doanh

---

### Phân tích Stakeholder

| Stakeholder                | Vai trò            | Lợi ích                                           | Tầm ảnh hưởng |
| -------------------------- | ------------------ | ------------------------------------------------- | ------------- |
| **Chủ sở hữu Nền tảng**    | Nhà đầu tư/Quản lý | ROI, Thị phần, Khả năng mở rộng                   | Cao           |
| **Tenants (Chủ cửa hàng)** | Người dùng chính   | Doanh thu, Dễ sử dụng, Tùy chỉnh                  | Cao           |
| **Khách hàng Cuối**        | Người mua          | Trải nghiệm người dùng, Khám phá sản phẩm, Hỗ trợ | Trung bình    |
| **Đội ngũ Phát triển**     | Nhân viên kỹ thuật | Kiến trúc, Khả năng bảo trì, Đổi mới              | Trung bình    |
| **Đội ngũ Hỗ trợ**         | Vận hành           | Gỡ lỗi, Tài liệu, Giám sát                        | Thấp          |
| **Cơ quan Quản lý**        | Tuân thủ           | Quyền riêng tư dữ liệu, Tiêu chuẩn bảo mật        | Trung bình    |

---

### Mục tiêu Kinh doanh

#### Mục tiêu Chính

1. **Thâm nhập thị trường**: Ra mắt MVP trong 6 tháng nhắm mục tiêu 100+ tenants
2. **Tăng trưởng Doanh thu**: Đạt $1M ARR trong 18 tháng
3. **Sự chấp nhận của Người dùng**: 10.000+ khách hàng cuối hoạt động trong năm đầu tiên
4. **Sự ổn định của Nền tảng**: 99,9% thời gian hoạt động với tốc độ tải trang dưới 2 giây

#### Mục tiêu Phụ

1. **Hoàn thiện Tính năng**: Đáp ứng 80% các trường hợp sử dụng e-commerce phổ biến
2. **Mở rộng Quốc tế**: Hỗ trợ đa tiền tệ và đa ngôn ngữ
3. **Ưu tiên Di động**: 60%+ lưu lượng truy cập từ thiết bị di động
4. **Tích hợp AI**: Công cụ tìm kiếm ngữ nghĩa và gợi ý sản phẩm

---

### Chỉ số Thành công & KPI

#### KPI Kinh doanh

- **Doanh thu Định kỳ Hàng tháng (MRR)**: Mục tiêu $85K vào tháng thứ 12
- **Chi phí Thu hút Khách hàng (CAC)**: <$200 mỗi tenant
- **Giá trị Vòng đời Khách hàng (CLV)**: >$2,000 mỗi tenant
- **Tỷ lệ Rời bỏ (Churn Rate)**: <5% tỷ lệ rời bỏ tenant hàng tháng

#### KPI Kỹ thuật

- **Sẵn sàng của Hệ thống**: 99,9% thời gian hoạt động
- **Tốc độ Tải trang**: Trung bình <2 giây
- **Thời gian Phản hồi API**: <500ms cho 95% các yêu cầu
- **Hiệu suất Cơ sở dữ liệu**: <100ms thời gian truy vấn cho các luồng quan trọng

#### KPI Trải nghiệm Người dùng

- **Sự Hài lòng của Người dùng**: Đánh giá trung bình 4.5+ sao
- **Tỷ lệ Chuyển đổi**: Trung bình 3%+ trên các tenants
- **Tỷ lệ Bỏ giỏ hàng**: <70%
- **Số lượng Yêu cầu Hỗ trợ**: <2 yêu cầu mỗi tenant mỗi tháng

---

### Vai trò & Quyền hạn Người dùng

#### Vai trò Cấp Nền tảng

1. **Super Admin**: Quản trị toàn hệ thống, quản lý tenant
2. **Nhân viên Hỗ trợ**: Hỗ trợ liên tenant, quyền chỉ đọc dữ liệu tenant
3. **Đội kiểm toán**: Giám sát tuân thủ và bảo mật

#### Vai trò Cấp Tenant

1. **Chủ cửa hàng (Store Owner)**: Toàn quyền cấu hình và dữ liệu của tenant
2. **Quản lý (Manager)**: Quản lý sản phẩm, xử lý đơn hàng, báo cáo
3. **Nhân viên (Staff)**: Truy cập hạn chế vào các chức năng cụ thể (dịch vụ khách hàng, hoàn tất đơn hàng)
4. **Khách hàng (Customer)**: Mua sắm, quản lý tài khoản, theo dõi đơn hàng

#### Ma trận Phân quyền

| Vai trò          | Cấu hình Cửa hàng | Sản phẩm   | Đơn hàng       | Khách hàng  | Phân tích  | Thanh toán |
| ---------------- | ----------------- | ---------- | -------------- | ----------- | ---------- | ---------- |
| Super Admin      | Toàn quyền        | Toàn quyền | Toàn quyền     | Toàn quyền  | Toàn quyền | Toàn quyền |
| Nhân viên Hỗ trợ | Đọc               | Đọc        | Đọc            | Đọc         | Đọc        | Đọc        |
| Chủ cửa hàng     | Toàn quyền        | Toàn quyền | Toàn quyền     | Toàn quyền  | Toàn quyền | Toàn quyền |
| Quản lý          | Hạn chế           | Toàn quyền | Toàn quyền     | Toàn quyền  | Toàn quyền | Đọc        |
| Nhân viên        | Không             | Hạn chế    | Hạn chế        | Hạn chế     | Không      | Không      |
| Khách hàng       | Không             | Đọc        | Đơn hàng riêng | Hồ sơ riêng | Không      | Không      |

---

### Quy trình Kinh doanh & Luồng công việc

#### Hành trình Khách hàng

1. **Khám phá**: Tìm kiếm sản phẩm qua tìm kiếm hỗ trợ AI, danh mục, gợi ý
2. **Cân nhắc**: So sánh sản phẩm, đọc đánh giá, kiểm tra tồn kho
3. **Mua hàng**: Thêm vào giỏ hàng, áp dụng khuyến mãi, thanh toán với nhiều lựa chọn
4. **Hoàn tất đơn hàng**: Theo dõi đơn hàng, nhận thông báo, quản lý trả hàng
5. **Duy trì**: Chương trình khách hàng thân thiết, gợi ý cá nhân hóa, đặt lại hàng

#### Quản lý Tenant

1. **Tham gia**: Thiết lập tài khoản, cấu hình tên miền, phương thức thanh toán
2. **Thiết lập Cửa hàng**: Danh mục sản phẩm, giá cả, quy tắc vận chuyển, cấu hình thuế
3. **Vận hành**: Xử lý đơn hàng, quản lý tồn kho, dịch vụ khách hàng
4. **Tăng trưởng**: Phân tích, chiến dịch marketing, tối ưu hóa hiệu suất

#### Vận hành Nền tảng

1. **Cung cấp Tenant**: Thiết lập tự động, phân bổ tài nguyên
2. **Giám sát**: Theo dõi hiệu suất, kiểm tra sức khỏe, cảnh báo
3. **Hỗ trợ**: Quản lý yêu cầu, cơ sở kiến thức, quy trình leo thang
4. **Bảo trì**: Cập nhật, sao lưu, phục hồi sau thảm họa

---

### Tổng quan Yêu cầu Chức năng

#### Tính năng Thương mại Cốt lõi

- **Quản lý Sản phẩm**: Sản phẩm đa biến thể, hàng hóa kỹ thuật số, theo dõi tồn kho
- **Quản lý Đơn hàng**: Thanh toán nhiều bước, xử lý đơn hàng, hoàn tất đơn hàng
- **Xử lý Thanh toán**: Nhiều cổng thanh toán, thanh toán định kỳ, chia sẻ thanh toán
- **Quản lý Vận chuyển**: Tích hợp nhiều đơn vị vận chuyển, giá thời gian thực, theo dõi

#### Tính năng Nâng cao

- **Tìm kiếm Hỗ trợ AI**: Tìm kiếm ngữ nghĩa, tìm kiếm hình ảnh, gợi ý sản phẩm
- **Kiến trúc Multi-tenant**: Cách ly dữ liệu hoàn toàn, tên miền tùy chỉnh
- **Khả năng B2B**: Nhóm khách hàng, giá theo tầng, đặt hàng số lượng lớn
- **Phân tích & Báo cáo**: Dashboards thời gian thực, báo cáo tùy chỉnh, xuất dữ liệu

#### Tính năng Nền tảng

- **Quản lý Người dùng**: Truy cập dựa trên vai trò, tích hợp SSO, 2FA
- **Quản lý Nội dung**: Blog, trang tĩnh, quản lý phương tiện
- **Công cụ Marketing**: Khuyến mãi, chương trình thân thiết, chiến dịch email
- **Trung tâm Tích hợp**: API bên thứ ba, webhooks, tiện ích mở rộng tùy chỉnh

---

### Yêu cầu Phi chức năng

#### Yêu cầu Hiệu suất

- **Thời gian Phản hồi**: <500ms cho các cuộc gọi API, <2s cho tốc độ tải trang
- **Thông lượng**: 10.000 người dùng đồng thời, 1.000 đơn hàng/phút
- **Khả năng Mở rộng**: Mở rộng theo chiều ngang với cân bằng tải
- **Sẵn sàng**: 99,9% thời gian hoạt động với các cửa sổ bảo trì định kỳ

#### Yêu cầu Bảo mật

- **Mã hóa Dữ liệu**: AES-256 cho dữ liệu tĩnh, TLS 1.3 cho dữ liệu truyền tải
- **Xác thực**: OAuth 2.0, JWT tokens, hỗ trợ 2FA
- **Phân quyền**: Kiểm soát truy cập dựa trên vai trò, giới hạn tốc độ API
- **Tuân thủ**: GDPR, PCI-DSS, SOC 2 Type II

#### Yêu cầu Sử dụng

- **Khả năng Truy cập**: Tuân thủ WCAG 2.1 AA
- **Phản hồi Di động**: Hỗ trợ ứng dụng web tiến bộ (PWA)
- **Quốc tế hóa**: Hỗ trợ đa ngôn ngữ, đa tiền tệ
- **Tùy chỉnh**: Hệ thống giao diện, tùy chọn white-label

---

### Ngân sách & Lộ trình

#### Ngân sách Phát triển: $500,000

- **Chi phí Đội ngũ**: $350,000 (6 lập trình viên, 1 PM, 1 DevOps)
- **Hạ tầng**: $75,000 (Dịch vụ đám mây, giám sát, công cụ)
- **Dịch vụ Bên thứ ba**: $50,000 (Cổng thanh toán, dịch vụ AI)
- **Dự phòng**: $25,000 (15% tổng cộng)

#### Lộ trình: 6 Tháng đến MVP

- **Giai đoạn 1 (Tháng 1-2)**: Kiến trúc cốt lõi, quản lý người dùng, sản phẩm cơ bản
- **Giai đoạn 2 (Tháng 3-4)**: Quản lý đơn hàng, thanh toán, vận chuyển
- **Giai đoạn 3 (Tháng 5-6)**: Tính năng nâng cao, tích hợp AI, kiểm thử

#### Chi phí Vận hành Hàng tháng: $50,000/tháng

- **Hạ tầng**: $20,000
- **Dịch vụ Bên thứ ba**: $15,000
- **Hỗ trợ & Bảo trì**: $10,000
- **Marketing & Bán hàng**: $5,000

---

### Đánh giá Rủi ro

#### Rủi ro Cao

1. **Độ phức tạp Kỹ thuật**: Thách thức về kiến trúc multi-tenant
2. **Cạnh tranh Thị trường**: Các đối thủ lớn với tài nguyên dồi dào
3. **Vi phạm Bảo mật**: Rò rỉ dữ liệu có thể gây hậu quả thảm khốc

#### Rủi ro Trung bình

1. **Vấn đề Hiệu suất**: Vấn đề mở rộng dưới tải trọng cao
2. **Sự chấp nhận của Người dùng**: Tốc độ thu hút tenant chậm
3. **Thay đổi Quy định**: Yêu cầu tuân thủ mới

#### Chiến lược Giảm thiểu rủi ro

1. **Kỹ thuật**: Triển khai theo giai đoạn, kiểm thử chuyên sâu, tư vấn chuyên gia
2. **Thị trường**: Tạo sự khác biệt qua tính năng AI và B2B
3. **Bảo mật**: Kiểm toán định kỳ, mã hóa, thực hành tốt nhất
4. **Hiệu suất**: Kiểm thử tải, giám sát, tự động mở rộng

---

### Giả định & Ràng buộc

#### Giả định

- Thị trường mục tiêu có truy cập internet ổn định
- Tenants có năng lực kỹ thuật cơ bản
- API cổng thanh toán sẽ duy trì ổn định
- Chi phí hạ tầng đám mây sẽ duy trì ở mức có thể dự đoán được

#### Ràng buộc

- Phải tuân thủ các luật bảo vệ dữ liệu quốc tế
- Giới hạn trong lộ trình 6 tháng cho MVP
- Ngân sách không được vượt quá $500,000 cho phát triển
- Phải hỗ trợ các đơn vị vận chuyển và thanh toán hiện có

---

### Tiêu chí Thành công

#### Thành công của MVP

- 100+ tenant trả phí trong vòng 3 tháng sau khi ra mắt
- 99,9% thời gian hoạt động của nền tảng
- Tốc độ tải trang trung bình <2 giây
- Phản hồi tích cực từ người dùng (đánh giá 4.0+)

#### Thành công Dài hạn

- 1,000+ tenant trong vòng 18 tháng
- $1M ARR trong vòng 18 tháng
- <5% tỷ lệ rời bỏ hàng tháng
- Bộ tính năng dẫn đầu thị trường

---

### Phê duyệt

**Nhà bảo trợ Dự án**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********

**Trưởng nhóm Kỹ thuật**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********

**Chủ sở hữu Kinh doanh**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********
