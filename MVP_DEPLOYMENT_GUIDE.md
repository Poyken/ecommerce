# Hướng Dẫn Triển Khai MVP (Production)

Tài liệu này hướng dẫn chi tiết quy trình đưa hệ thống E-commerce (API & Web) lên môi trường Production sử dụng các dịch vụ Cloud: **Vercel (Web)**, **Render (API)**, **Neon (Database)**, và **Upstash (Redis)**.

---

## 1. Chuẩn bị Tài nguyên

Đảm bảo bạn đã có tài khoản và Project tại các dịch vụ sau:

1.  **Neon** ([neon.tech](https://neon.tech)): PostgreSQL Database.
2.  **Upstash** ([upstash.com](https://upstash.com)): Redis Cache.
3.  **GitHub**: Chứa source code `api` và `web`.
4.  **Render** ([render.com](https://render.com)): Để host API Backend.
5.  **Vercel** ([vercel.com](https://vercel.com)): Để host Web Frontend.

---

## 2. Triển khai Database & Redis

### 2.1. Cấu hình & Lấy Connection String

Sau khi tạo project trên Neon và Upstash, bạn cần lấy các thông số kết nối để dùng cho bước sau (nên copy từ file `.env` local nếu đã chạy thành công).

- **Neon (PostgreSQL)**:

  - Connection String: `postgres://<user>:<password>@<host>/neondb?sslmode=require`
  - _Lưu ý_: Nên dùng chế độ **Pooled Connection** (bắt đầu bằng `postgres://...-pooler...`) để tối ưu hiệu năng.

- **Upstash (Redis)**:
  - Connection String: `rediss://default:<password>@<host>:6379`
  - _Lưu ý_: Phải có `rediss://` (TLS) để bảo mật.

---

## 3. Triển khai API (Render - Docker)

### 3.1. Tạo Web Service

1. Truy cập [dashboard.render.com](https://dashboard.render.com).
2. Chọn **New +** -> **Web Service**.
3. Kết nối repository **`api`** (hoặc repo chứa api).

### 3.2. Cấu hình Runtime

Chọn các thông số sau:

- **Runtime**: **Docker** (Quan trọng).
- **Region**: Singapore (cho tốc độ tốt nhất về VN).
- **Branch**: `main`.
- **Docker Context Directory**: `.` (hoặc `api` nếu dùng monorepo).
- **Dockerfile Path**: `Dockerfile` (hoặc `api/Dockerfile`).

> **Lưu ý**: Vì dùng Docker, bạn **KHÔNG** cần điền Build Command hay Start Command. Dockerfile đã lo việc này (bao gồm cả chạy migration database).

### 3.3. Cấu hình Environment Variables

Vào tab **Environment** và thêm:
| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | _(Chuỗi kết nối Neon)_ |
| `REDIS_URL` | _(Chuỗi kết nối Upstash `rediss://...`)_ |
| `JWT_ACCESS_SECRET` | _(Tự tạo)_ |
| `JWT_REFRESH_SECRET` | _(Tự tạo)_ |
| `PORT` | `8080` (Phải khớp với EXPOSE trong Dockerfile) |
| `FRONTEND_URL` | _(Điền sau khi deploy Web)_ |

Bấm **Deploy Web Service**. Chờ báo thành công.

---

## 4. Triển khai Web (Vercel - Khuyên dùng)

Để hỗ trợ tính năng **Multi-tenant (Subdomain)** tốt nhất, chúng ta sẽ sử dụng Vercel.

### 4.1. Tạo Project

1. Truy cập [vercel.com](https://vercel.com) -> **Add New...** -> **Project**.
2. Import Repository **`web`**.

### 4.2. Cấu hình Environment Variables

Thêm các biến sau vào mục **Environment Variables**:
| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://api-name.onrender.com/api/v1` (URL API ở Bước 3) |
| `API_URL` | `https://api-name.onrender.com/api/v1` |

> **Lưu ý**: Không cần biến `PORT` trên Vercel.

### 4.3. Deploy

Bấm **Deploy**. Chờ đến khi có domain `https://project.vercel.app`.

---

## 5. Cấu hình Tự động Deploy Tenant (Multi-tenant)

Đây là bước quan trọng nhất để tính năng **New Tenant** hoạt động "tự động" mà không cần deploy lại.

### 5.1. Mua tên miền (Domain)

Bạn cần một tên miền thực (VD: `myshop.com`). Bạn không thể test tính năng này với domain miễn phí của Vercel (`.vercel.app`).

### 5.2. Cấu hình Wildcard Domain trên Vercel

1. Vào Project Web trên Vercel -> **Settings** -> **Domains**.
2. Thêm tên miền gốc: `myshop.com`.
3. Thêm tên miền Wildcard: `*.myshop.com`.
   - Vercel sẽ yêu cầu bạn cấu hình DNS (CNAME hoặc A Record) tại nhà cung cấp tên miền.
   - **Quan trọng**: Bản ghi Wildcard `*` cho phép mọi subdomain (vd: `store1.myshop.com`, `fashion.myshop.com`) đều trỏ về cùng một ứng dụng Web này.

### 5.3. Quy trình "Tự động" (Dành cho Phương án 1 - Có Domain riêng)

Sau khi cấu hình xong bước 5.2:

1. Bạn vào trang Admin, tạo Tenant mới (VD: `techstore`).
2. Hệ thống lưu tenant vào Database.
3. Người dùng truy cập ngay lập tức được vào `techstore.myshop.com`.
4. **KHÔNG** cần deploy lại code hay server. Code Next.js sẽ tự động đọc subdomain `techstore` và tải dữ liệu tương ứng.

### 5.4. Phương án 2: Dùng Miễn phí (Thủ công - Không cần mua Domain)

Nếu bạn không muốn mua domain, bạn có thể dùng domain `vercel.app` mặc định, nhưng quy trình sẽ hơi thủ công một chút:

1. **Bước 1**: Vào trang Admin của Web App, tạo Tenant mới (Ví dụ slug là `store-1`).
2. **Bước 2**: Truy cập Dashboard **Vercel** -> Project Web -> **Settings** -> **Domains**.
3. **Bước 3**: Nhập và Add domain thủ công theo cú pháp: `store-1.project-name.vercel.app`.
   - _(Thay `project-name` bằng tên project Vercel của bạn)_.
4. **Bước 4**: Chờ vài giây Vercel cập nhật. Sau đó bạn có thể vào `https://store-1.project-name.vercel.app` để xem shop.

> **Tổng kết**:
>
> - Mua Domain: Tự động hoàn toàn (Chuyên nghiệp).
> - Dùng Free: Phải Add domain bằng tay mỗi khi tạo Shop mới.

---

## 6. Hoàn tất kết nối

1. Copy tên miền chính của Web (VD: `https://myshop.com` hoặc `https://web-app.vercel.app` nếu chưa mua domain).
2. Quay lại **Render (API Service)** -> Environment.
3. Update `FRONTEND_URL` = Domain đó.
   - _Nếu dùng Wildcard, bạn có thể cần cấu hình CORS trên API để chấp nhận `_.myshop.com`(Sẽ cấu hình trong code NestJS sau nếu cần thiết, tạm thời`FRONTEND_URL` dùng cho callback).\*
4. API tự Redeploy. Hệ thống sẵn sàng!

---

## 7. Kiểm tra & Debug

### 7.1. Kiểm tra kết nối Database

Nếu API deploy thất bại với lỗi liên quan đến Database:

- Kiểm tra lại `DATABASE_URL` đã đúng chưa?
- Đảm bảo Neon DB đang hoạt động (không bị sleep).
- Vào tab **Logs** trên Render để xem chi tiết lỗi.

### 6.2. Kiểm tra tính năng Tenant

Để test tính năng Multi-tenant (Subdomain):

1.  Vào **Vercel** -> **Settings** -> **Domains**.
2.  Thêm domain (hoặc subdomain) wildcard nếu bạn có domain riêng (ví dụ `*.myshop.com`).
3.  Nếu không có domain riêng, bạn chỉ test được Tenant `default` (Main Store).

### 6.3. Cập nhật Database sau này

Khi bạn sửa đổi Schema (`schema.prisma`) ở local và muốn update lên Production:

1.  Commit & Push code mới lên Git.
2.  Render sẽ tự động build lại.
3.  Lệnh `npm run start:prod` (đã cấu hình ở Bước 3.2) sẽ tự chạy `prisma migrate deploy` để update DB.
