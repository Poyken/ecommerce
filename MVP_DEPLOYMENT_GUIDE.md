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

## 4. Triển khai Web (Render - Docker)

Thay vì Vercel, chúng ta sẽ dùng Render để chạy Docker cho Web (Next.js Standalone).

### 4.1. Tạo Web Service

1. Dashboard -> **New +** -> **Web Service**.
2. Kết nối repository **`web`**.

### 4.2. Cấu hình Runtime

- **Runtime**: **Docker**.
- **Region**: Singapore.
- **Docker Context Directory**: `.` (hoặc `web`).
- **Dockerfile Path**: `Dockerfile` (hoặc `web/Dockerfile`).

### 4.3. Cấu hình Environment Variables

| Key        | Value                                                           |
| :--------- | :-------------------------------------------------------------- |
| `NODE_ENV` | `production`                                                    |
| `PORT`     | `3000`                                                          |
| `API_URL`  | `https://api-name.onrender.com/api/v1` (URL của API vừa deploy) |

> **Giải thích**:
>
> - `API_URL`: Biến này được Next.js Server dùng để proxy request từ `/api/v1` sang Backend thật.
> - Web App dùng `output: standalone` nên cực nhẹ và nhanh.

Bấm **Deploy Web Service**.

---

## 5. Hoàn tất kết nối

1. Copy URL của Web Service vừa tạo (VD: `https://web-name.onrender.com`).
2. Quay lại **API Service** -> Environment.
3. Update `FRONTEND_URL` = `https://web-name.onrender.com`.
4. API sẽ tự Redeploy. Hệ thống hoàn tất!

---

## 6. Kiểm tra & Debug

### 6.1. Kiểm tra kết nối Database

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
