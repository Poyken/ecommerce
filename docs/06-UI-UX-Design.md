# Thông số Thiết kế UI/UX

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Thiết kế  
**Trạng thái**: Bản nháp

---

### Triết lý Thiết kế

#### Nguyên tắc Cốt lõi

1. **Thiết kế Lấy người dùng làm trung tâm**: Mọi quyết định ưu tiên nhu cầu người dùng và mục tiêu kinh doanh.
2. **Tính nhất quán**: Trải nghiệm thống nhất trên mọi điểm tiếp xúc.
3. **Khả năng truy cập (Accessibility)**: Thiết kế bao trùm cho tất cả mọi người.
4. **Hiệu suất**: Tương tác nhanh chóng, phản hồi tức thì.
5. **Khả năng mở rộng**: Hệ thống thiết kế phát triển song hành cùng nền tảng.

#### Mục tiêu Thiết kế

- **Tối ưu hóa Chuyển đổi**: Quy trình mua hàng và thanh toán tinh gọn.
- **Xây dựng Lòng tin**: Giao diện chuyên nghiệp, đáng tin cậy.
- **Linh hoạt Thương hiệu**: Khả năng tùy chỉnh cao cho các tenant khác nhau.
- **Ưu tiên Di động (Mobile First)**: Tối ưu cho trải nghiệm trên thiết bị di động.
- **Sẵn sàng Quốc tế hóa**: Hỗ trợ đa ngôn ngữ và đa tiền tệ.

---

### Hệ thống Thiết kế (Design System)

#### Bảng màu (Color Palette)

##### Màu sắc Chủ đạo (Hệ thống Monochrome)

```css
/* Màu cơ bản */
--color-black: #000000;
--color-white: #ffffff;
--color-gray-50: #fafafa;
/* ... các mức độ màu xám khác ... */
--color-gray-900: #171717;

/* Màu ngữ nghĩa */
--color-primary: var(--color-gray-900);
--color-primary-foreground: var(--color-white);
--color-secondary: var(--color-gray-100);
--color-secondary-foreground: var(--color-gray-900);
```

##### Hệ thống màu cho Admin Dashboard

```css
--color-emerald: #10b981; /* Phân tích */
--color-sky: #0ea5e9; /* Đơn hàng */
--color-violet: #8b5cf6; /* Khách hàng */
--color-rose: #f43f5e; /* Marketing */
```

#### Kiểu chữ (Typography)

##### Font chữ sử dụng

- **Sans-serif (Chính)**: 'Inter', system-ui, sans-serif.
- **Monospace (Mã nguồn)**: 'JetBrains Mono', monospace.
- **Serif (Nghệ thuật)**: 'Crimson Text', serif.

##### Thang cỡ chữ

| Phần tử | Kích thước      | Độ đậm   | Cách dùng       |
| ------- | --------------- | -------- | --------------- |
| H1      | 2.25rem (36px)  | Bold     | Tiêu đề trang   |
| H2      | 1.875rem (30px) | Bold     | Tiêu đề mục lớn |
| H3      | 1.5rem (24px)   | Semibold | Tiêu đề mục nhỏ |
| Body    | 1rem (16px)     | Normal   | Nội dung chính  |

---

### Thư viện Thành phần (Component Library)

#### Nút bấm (Buttons)

- **Primary**: Hành động chính, nền đậm.
- **Secondary**: Hành động phụ, dạng outline.
- **Ghost**: Hành động tinh tế, không nền.
- **Destructive**: Hành động xóa, nền đỏ cảnh báo.

#### Các phần tử Form

- **Trường nhập liệu (Input)**: Thiết kế tối giản, hỗ trợ trạng thái focus và lỗi rõ ràng.
- **Trạng thái Validation**: Màu sắc trực quan (Xanh - Thành công, Đỏ - Lỗi).

#### Thẻ sản phẩm (Product Card)

- Thiết kế dạng lưới, tập trung vào hình ảnh và giá cả.
- Hiệu ứng hover nhẹ nhàng để tăng tính tương tác.

---

### Hệ thống Layout

#### Hệ thống lưới (Grid System)

- Sử dụng CSS Grid cho bố cục 12 cột linh hoạt.
- Khoảng cách (Gutter) nhất quán: 1.5rem (24px).

#### Các điểm gãy (Breakpoints)

- **Mobile**: < 640px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

### Sơ đồ Luồng người dùng (User Flows)

#### Hành trình mua hàng của Khách hàng

1. **Trang chủ** -> **Tìm kiếm/Duyệt sản phẩm** -> **Chi tiết sản phẩm** -> **Giỏ hàng** -> **Thanh toán**.

#### Luồng Quản lý Đơn hàng của Admin

1. **Danh sách đơn hàng** -> **Chi tiết đơn hàng** -> **Xử lý/Vận chuyển** -> **Cập nhật trạng thái**.

---

### Hướng dẫn về Khả năng truy cập (Accessibility)

#### Tuân thủ WCAG 2.1 AA

1. **Tính trực quan**: Độ tương phản màu sắc tối thiểu 4.5:1.
2. **Tính vận hành**: Hỗ trợ hoàn toàn điều hướng bằng bàn phím.
3. **Tính dễ hiểu**: Ngôn ngữ rõ ràng, thông báo lỗi dễ hiểu.
4. **Tính bền vững**: Tương thích tốt với các trình đọc màn hình.

---

### Hiệu ứng và Tương tác nhỏ (Micro-interactions)

- **Nguyên tắc**: Hiệu ứng cần có mục đích, không gây xao nhãng.
- **Tốc độ**: Chuyển động nhanh (150ms - 300ms) để cảm giác ứng dụng mượt mà.

---

### Hướng dẫn Hiệu suất (Performance)

- **Tối ưu hình ảnh**: Sử dụng định dạng WebP, tải chậm (lazy loading).
- **CSS & JS**: Chia nhỏ mã nguồn, loại bỏ các phần không sử dụng.

---

### Quốc tế hóa và Thương hiệu

- **Hỗ trợ Đa ngôn ngữ**: Thiết kế linh hoạt cho các ngôn ngữ có độ dài văn bản khác nhau.
- **Tùy chỉnh Thương hiệu (White-labeling)**: Cho phép tenant thay đổi màu sắc chủ đạo, logo và font chữ qua hệ thống biến CSS.

---

### Phê duyệt

**Trưởng nhóm Thiết kế**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********

**Trưởng nhóm UX**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********

**Quản lý Sản phẩm**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********
