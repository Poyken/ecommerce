# 🏗️ Kiến Trúc Hệ Thống Web Frontend (Ecommerce-main)

Tài liệu này mô tả chi tiết kiến trúc kỹ thuật của lớp ứng dụng Web, cách tổ chức mã nguồn và các nguyên tắc thiết kế được áp dụng trong dự án.

## 1. Stack Công Nghệ Chính (Core Technologies)

Hệ thống được xây dựng trên các công nghệ tiên tiến nhất nhằm đảm bảo hiệu năng, tính bảo mật và khả năng mở rộng:

| Thành phần               | Công nghệ                           |
| :----------------------- | :---------------------------------- |
| **Framework**            | **Next.js 15+** (App Router)        |
| **Thư viện UI**          | **React 19**, Tailwind CSS 4.0      |
| **Component Nguyên bản** | Radix UI (Accessible Primitives)    |
| **Quản lý Trạng thái**   | Zustand (Global), SWR (Fetch/Cache) |
| **Xác thực**             | Jose (JWT), Next.js Cookies         |
| **Animation**            | Framer Motion (Micro-interactions)  |
| **Đa ngôn ngữ**          | next-intl (Middleware-based)        |

---

## 2. Cấu Trúc Thư Mục (Feature-Driven Design)

Dự án áp dụng mô hình phân tách theo tính năng (Domain), giúp giảm thiểu sự phụ thuộc lẫn nhau giữa các module.

### 📁 Thư mục `app/` (Routing & Layouts)

Quản lý các luồng điều hướng của ứng dụng. Sử dụng cơ chế dynamic routing `[locale]` cho quốc tế hóa.

- `(shop)/`: Các trang dành cho người mua hàng (Trang chủ, Sản phẩm, Giỏ hàng).
- `admin/`: Các trang quản trị cho từng chủ cửa hàng (Store Manager).
- `super-admin/`: Giao diện quản trị hệ thống cho chủ nền tảng (SaaS Owner).

### 📁 Thư mục `features/` (Core Logic)

Chứa toàn bộ logic nghiệp vụ được đóng gói. Mỗi feature bao gồm:

- `/components`: Các UI component đặc thù của tính năng.
- `/actions`: Các Server Actions để giao tiếp dữ liệu.
- `/hooks`: Custom hooks xử lý logic nội bộ.

### 📁 Thư mục `lib/` (The Engine)

Chứa các công cụ hạ tầng:

- `http.ts`: Trái tim của hệ thống giao tiếp mạng.
- `utils.ts`: Các hàm tiện ích xử lý định dạng tiền tệ, ngày tháng, classname merging.
- `constants.ts`: Lưu trữ các hằng số, trạng thái đơn hàng, cấu hình hệ thống.

---

## 3. Cơ Chế Hiển Thị (Rendering Strategy)

Ứng dụng tận dụng tối đa các cơ chế render của Next.js để tối ưu hóa SEO và tốc độ:

1.  **Server-Side Rendering (SSR):** Sử dụng cho các trang cần dữ liệu cá nhân hóa (Dashboard, User Profile, Checkout).
2.  **Static Site Generation (SSG):** Áp dụng cho trang chủ và danh sách sản phẩm. Sử dụng kỹ thuật `ISR` (Incremental Static Regeneration) để cập nhật dữ liệu mà không cần build lại.
3.  **Client-Side Rendering (CSR):** Dùng cho các tương tác thời gian thực như Chat, Bộ lọc sản phẩm dinamic, và xử lý Form.

---

## 4. Hỗ Trợ Đa Cửa Hàng (Multi-tenancy Support)

Đây là tính năng cốt lõi của hệ thống SaaS:

- **Xác định Tenant:** Middleware và `http` client tự động nhận diện `hostname` để gửi header `X-Tenant-Domain` về Backend.
- **Dynamic Styling:** Cấu hình màu sắc (Primary Color) và logo được fetch từ API và áp dụng linh hoạt cho Storefront của khách hàng.

---

## 5. Nguyên Tắc Thiết Kế UI/UX

- **Aesthetics Level:** Sử dụng hiệu ứng Glassmorphism, Gradient tinh tế và thủ thuật đổ bóng (Shadows) để tạo cảm giác cao cấp.
- **Micro-animations:** Mọi tương tác (hover nút, mở modal, chuyển tab) đều có hiệu ứng mượt mà qua Framer Motion.
- **Global Loading:** Tích hợp `nextjs-toploader` và bộ xương (Skeletons) để người dùng không cảm thấy ứng dụng bị "đứng" khi chờ dữ liệu.

---

📅 _Cập nhật lần cuối: 13/01/2026_
