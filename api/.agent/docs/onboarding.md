# Getting Started (Onboarding)

> **Role:** Backend Developer
> **Stack:** NestJS, PostgreSQL, Redis, Prisma.

## 1. Prerequisites (Yêu cầu môi trường)

Trước khi bắt đầu, hãy cài đặt các tool sau:

- **Node.js**: v20.x (LTS) ([Download](https://nodejs.org/))
- **Docker Desktop**: Để chạy Database & Redis ([Download](https://www.docker.com/))
- **VSCode**: Editor khuyên dùng.

## 2. Installation (Cài đặt)

```bash
# 1. Clone repository
git clone https://github.com/your-org/api.git
cd api

# 2. Install dependencies
npm install
```

## 3. Environment Setup (Cấu hình)

Copy file mẫu và điền thông tin:

```bash
cp .env.example .env
```

**Các biến quan trọng cần điền:**

- `DATABASE_URL="postgresql://user:pass@localhost:5432/ecommerce?schema=public"`
- `REDIS_URL="redis://localhost:6379"`
- `JWT_ACCESS_SECRET="secret-dev"`

## 4. Database Initialization (Khởi tạo DB)

Bật Docker lên và chạy lệnh sau để khởi tạo DB & Redis:

```bash
# 1. Start Infrastructure (Postgres + Redis)
docker compose up -d postgres redis

# 2. Push Schema to DB
npx prisma migrate dev

# 3. Seed Fake Data (Optional)
npm run seed
```

## 5. Running the App (Chạy ứng dụng)

```bash
# Development Mode (Watch changes)
npm run start:dev

# Debug Mode
npm run start:debug
```

Server sẽ chạy tại: `http://localhost:8080`
Swagger Docs: `http://localhost:8080/docs`

## 6. Common Commands (Lệnh thường dùng)

| Command               | Description                              |
| :-------------------- | :--------------------------------------- |
| `npx prisma studio`   | Mở GUI xem dữ liệu DB.                   |
| `npm test`            | Chạy Unit Test.                          |
| `npx nest g resource` | Tạo module mới (Controller/Service/DTO). |
| `npm run lint`        | Kiểm tra lỗi cú pháp.                    |
