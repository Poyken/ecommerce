# Phân Tích Kiến Trúc & Chiến Lược Mở Rộng (Scaling)

Tài liệu này đánh giá kiến trúc hiện tại của dự án Ecommerce dựa trên `schema.prisma` và đề xuất các phương án mở rộng theo từng giai đoạn phát triển.

## 1. Đánh giá Kiến trúc Hiện tại

**Kiến trúc:** Next.js 16 (App Router) + TailwindCSS 4 + SWR.

## 1. Frontend Patterns (Next.js 16)

- **Server-First Data Fetching**: Ưu tiên Server Component để fetch data ban đầu (SEO & Speed).
- **Type-Safe Actions**: Mọi thao tác mutate data (POST/PATCH/DELETE) PHẢI qua `next-safe-action`.
- **SWR for Client Logic**: Dùng SWR cho các phần cần real-time, optimistic UI hoặc background revalidation (Cart, Wishlist, Product Live Filter).
- **Zustand for App State**: Quản lý UI state nhẹ (Sidebar, Modals, Local Settings).

## 2. Component System (Shadcn/UI)

- **Rich Aesthetics**: Sử dụng Tailwind 4 với CSS variables cho dynamic theming (Tenant-specific primary colors).
- **Micro-animations**: Framer Motion cho các tương tác premium.
- **Responsive-First**: Mobile-first design sử dụng flex/grid utilities.

### Ưu điểm:

- **Tốc độ phát triển nhanh:** Dễ dàng setup, deploy và bảo trì ban đầu.
- **Chi phí thấp:** Chỉ cần 1 Database instance, tài nguyên share chung hiệu quả.
- **Tính nhất quán:** Dễ dàng thực hiện các query cross-tenant (ví dụ: thống kê tổng hệ thống) hoặc update schema.
- **Tooling hỗ trợ tốt:** Prisma, NestJS hoạt động mượt mà với mô hình này.

### Nhược điểm & Rủi ro:

- **Noisy Neighbor:** Một Tenant lớn hoạt động nặng (ví dụ: chạy report, sale lớn) có thể làm chậm toàn bộ hệ thống, ảnh hưởng Tenant khác.
- **Data Isolation (Bảo mật):** Phụ thuộc hoàn toàn vào code (WHERE tenantId = ...). Nếu code lỗi, Tenant A có thể thấy dữ liệu Tenant B.
- **Giới hạn Database:** Khi bảng `Order` hoặc `InventoryLog` lên tới hàng trăm triệu dòng, index `tenantId` có thể không còn hiệu quả, việc backup/restore cho riêng 1 tenant rất khó.

---

## 2. Các Phương Án Kiến Trúc Thay Thế

Dưới đây là các mô hình khác có thể cân nhắc khi dự án phát triển:

### Phương án A: Schema-per-Tenant (PostgreSQL Schemas)

Tạo ra các schema riêng biệt (namespace) trong cùng 1 Database (Postgres) cho mỗi Tenant.

- **Lý do chọn:** Tăng mức độ cô lập dữ liệu mà không tốn quá nhiều chi phí hạ tầng như Database riêng. Backup/Restore từng schema dễ hơn.
- **Thách thức:** Quản lý migration phức tạp hơn (phải chạy migration cho N schemas). Prisma hỗ trợ Multi-schema nhưng cần cấu hình kỹ.

### Phương án B: Database-per-Tenant

Mỗi Tenant có một Database riêng hoàn toàn.

- **Lý do chọn:** Cô lập tuyệt đối (Performance, Security). Dễ dàng scale CPU/RAM cho các Tenant VIP (Enterprise).
- **Thách thức:** Chi phí hạ tầng cao. Quản lý connection pool phức tạp. Rất khó maintain nếu có hàng nghìn tenant nhỏ.

### Phương án C: Microservices

Tách nhỏ hệ thống thành Catalog Service, Order Service, Inventory Service...

- **Lý do chọn:** Scale độc lập từng module. Team size lớn có thể làm việc song song dễ hơn.
- **Thách thức:** Complexity cực cao (Network latency, Distributed transactions, Deployment). **Không khuyến khích ở giai đoạn đầu.**

---

## 3. Lộ trình Kiến trúc theo Quy mô (Scaling Strategy)

Dựa vào `schema.prisma` hiện tại, đây là lộ trình khuyến nghị:

### Cấp độ 1: Startup / MVP (< 100 Tenants, < 10k orders/tháng)

**Kiến trúc:** Giữ nguyên hiện tại (Shared Database).

- **Hạ tầng:** 1 API Server, 1 DB Postgres, 1 Redis (Caching đơn giản).
- **Tối ưu:** Đảm bảo mọi query Prisma đều có `where: { tenantId }`. Đánh index kỹ các trường hay lọc (`slug`, `status`, `createdAt`, `email`...).

### Cấp độ 2: Growth (100 - 1,000 Tenants, Traffic tăng)

**Kiến trúc:** Modular Monolith (Tách biệt Logical).

- **Database:**
  - Sử dụng **Read Replicas**: Đẩy các query đọc (Catalog, Listing) sang Replica, Master chỉ để ghi (Order, Inventory).
  - Tối ưu bảng `AuditLog`, `InventoryLog`: Partitioning bảng theo thời gian (ví dụ: mỗi tháng 1 partition) để giữ bảng chính nhẹ.
- **Application:** Tách `Worker Service` để xử lý background jobs (gửi email, xử lý ảnh, tính toán report) để API chính không bị block.

### Cấp độ 3: Scale (1,000+ Tenants, Enterprise Customers)

**Kiến trúc:** Hybrid Multi-tenancy.

- **Chiến lược:**
  - Các Tenant nhỏ (Basic Plan) tiếp tục dùng Shared Database như cũ.
  - Các Tenant lớn (Enterprise Plan) được chuyển sang **Database riêng** hoặc **Schema riêng**.
- **Lý do:** Giải quyết vấn đề "Noisy Neighbor" cho khách hàng VIP trả tiền cao.
- **Thay đổi Code:** Cần Abstract lớp Connection Factory để trỏ đúng DB dựa vào Tenant Context.

### Cấp độ 4: High Scale (Big Data / Complex Logic)

**Kiến trúc:** Microservices (Chỉ tách những phần cần thiết).

- **Tách Inventory:** Module Inventory chịu tải cao nhất và lock nhiều nhất -> Tách ra service riêng, database riêng tối ưu cho ghi nhận transaction cao.
- **Event Driven:** Dùng Kafka/RabbitMQ để đồng bộ dữ liệu giữa các services thay vì gọi trực tiếp.

## Kết luận

Với các nâng cấp ở Phase 24, hệ thống đã tiến gần tới **Cấp độ 2 (Growth)**:

- Đã có Multi-warehouse & Intelligent Routing.
- Đã có Internationalization & Multi-currency.
- Cần tiếp tục tối ưu Caching Strategy và tách rời Worker Service để hoàn thiện.

- **Lời khuyên ngay lúc này:** Đừng vội áp dụng Microservices hay Database-per-tenant. Hãy tập trung vào việc:
  1.  Xây dựng lớp **Service/Repository** thật tốt để sau này dễ tách (Modular Monolith).
  2.  Implement **Caching Strategy** (Redis) cho Catalog/Product vì đây là phần read heavy nhất.
  3.  Chuẩn bị cơ chế **Data Sharding/Partitioning** cho các bảng Log (Audit, Inventory).

---

## 4. Phụ lục: Giải thích chuyên sâu (Deep Dive)

Giải đáp các câu hỏi thường gặp về kỹ thuật:

### Q1: "Schema riêng biệt (namespace)" là gì trong PostgreSQL?

Hãy tưởng tượng Database của bạn giống như một tòa nhà chung cư (Cluster).

- **Database (Database-per-tenant):** Giống như mỗi gia đình ở hẳn một tòa nhà riêng biệt. Rất riêng tư nhưng tốn kém (xây dựng, bảo vệ, điện nước riêng).
- **Shared Schema (Hiện tại):** Giống như tất cả mọi người sống chung trong một đại sảnh lớn. Dữ liệu (đồ đạc) để lẫn lộn, phải dán nhãn tên (tenantId) để không cầm nhầm.
- **Separate Schema (Schema-per-tenant):** Giống như một tòa nhà chia thành nhiều căn hộ. Mỗi Tenant có một căn hộ riêng (Schema) trong cùng một tòa nhà (Database).
  - Dữ liệu hoàn toàn tách biệt. Tenant A không thể "nhìn nhầm" sang bảng của Tenant B.
  - Dùng chung tài nguyên (CPU/RAM) của tòa nhà nên tiết kiệm chi phí hơn xây nhiều tòa nhà.
  - Trong Postgres, nó là **Namespaces**. Ví dụ: thay vì gọi `SELECT * FROM User`, ta gọi `SELECT * FROM tenant_a.User` hay `SELECT * FROM tenant_b.User`.

### Q2: Neon Database có hỗ trợ "Database-per-Tenant" không?

**Câu trả lời là CÓ và HỖ TRỢ RẤT TỐT.**

Neon là **Serverless PostgreSQL**, kiến trúc của nó khắc phục được nhược điểm lớn nhất của mô hình Database-per-tenant truyền thống là **Chi phí** và **Quản lý**.

- **Scale to Zero:** Nếu bạn có 1000 tenants, nhưng chỉ có 50 tenant đang hoạt động, Neon sẽ tự động "tắt" 950 DB kia đi để không tốn tiền Compute. Khi tenant quay lại, nó bật lên lại trong vài ms.
- **Branching:** Neon cho phép tạo bản sao (branch) của DB tức thì. Rất hữu ích khi bạn muốn debug dữ liệu của một tenant cụ thể mà không sợ làm hỏng dữ liệu thật.
- **Kết luận:** Nếu dùng Neon, rào cản về hạ tầng cho phương án **B (Database-per-Tenant)** giảm đi đáng kể. Bạn hoàn toàn có thể cân nhắc phương án này sớm hơn nếu tài chính cho phép (vì vẫn đắt hơn Shared DB một chút, nhưng rẻ hơn nhiều so với RDS truyền thống).

### Q3: SQS là gì? Tại sao cần nó?

**AWS SQS (Simple Queue Service)** là dịch vụ hàng đợi thông điệp (Message Queue) được AWS quản lý hoàn toàn.

- **Vấn đề:** Khi khách hàng đặt hàng ("Order Placed"), hệ thống phải làm rất nhiều việc: Gửi Email xác nhận + Trừ kho + Tính điểm thưởng + Báo cho bên vận chuyển. Nếu làm tất cả việc này trong lúc khách hàng ấn nút "Mua ngay", họ sẽ phải chờ rất lâu (User Experience tệ) và nếu gửi email lỗi, đơn hàng có thể bị lỗi theo.
- **Giải pháp (Async Processing):**
  1. API chỉ ghi đơn hàng vào DB và gửi một tin nhắn vào **Queue (SQS)**: "Có đơn hàng mới #123".
  2. API trả về "Thành công" cho khách ngay lập tức (nhanh < 100ms).
  3. Một **Worker Service** (ẩn sau cánh gà) sẽ lấy tin nhắn từ SQS và từ từ xử lý việc gửi email, trừ kho...
- **Redis BullMQ vs SQS:**
  - _BullMQ:_ Nhanh, rẻ, tự host. Phù hợp giai đoạn đầu.
  - _SQS:_ Không cần cài đặt, độ tin cậy cực cao (AWS lo), scale vô tận. Phù hợp khi hệ thống cực lớn, không muốn lo lắng về việc Redis bị đầy bộ nhớ.

### Q4: Tại sao Enterprise cần Kubernetes (K8s) và Terraform?

Khi bạn có 1 server, bạn có thể SSH vào và gõ lệnh setup. Nhưng khi bạn có **100 servers** hay **1000 containers** (cho hàng ngàn tenant):

- **Kubernetes (K8s) - Người nhạc trưởng:**
  - Bạn không thể quản lý thủ công 100 cái containers (cái nào sống, cái nào chết, cái nào quá tải).
  - K8s tự động hóa việc đó: "Container A chết? Tự khởi động lại cái mới", "Traffic tăng gấp đôi? Tự đẻ thêm 10 containers nữa". Nó đảm bảo hệ thống "Always On".
- **Terraform - Xây nhà bằng bản vẽ (IaC):**
  - Thay vì vào trang quản trị AWS click chuột tạo Server (dễ click nhầm, không nhớ đã click gì), bạn viết 1 file code (`main.tf`).
  - Chạy lệnh `terraform apply`, nó sẽ dựng lên toàn bộ hạ tầng y hệt bản vẽ.
  - **Lợi ích:** Có thể xóa đi dựng lại cả hệ thống trong vài phút (Disaster Recovery). Audit được ai đã sửa gì vào hạ tầng (thông qua Git).

---

---

## 5. Chiến lược Hạ tầng & Cloud (Infrastructure Mapping)

Để hiện thực hóa các cấp độ kiến trúc trên, đây là bản đồ áp dụng các dịch vụ Cloud/Infra tương ứng:

### Cấp độ 1: Startup / MVP (Kost-efficiency)

Mục tiêu: Rẻ nhất có thể, setup nhanh, ít maintenance.

- **Compute (NestJS):** PaaS như **Railway**, **Render** hoặc **Hetzner VPS** (chạy Docker Compose).
- **Database (Prisma):** **Neon (Serverless Postgres)**. Tận dụng gói Free/Pro, không lo về quản lý server.
- **Storage (Media):** **AWS S3** hoặc **Cloudflare R2** (rẻ hơn S3, không phí egress).
- **Cache:** Chưa cần hoặc dùng Redis nhỏ tích hợp sẵn trên PaaS.

### Cấp độ 2: Growth (Performance & Stability)

Mục tiêu: Chịu tải tốt hơn, bắt đầu tách rời các thành phần.

- **Compute:** Chuyển sang **Docker Swarm** hoặc **AWS ECS (Fargate)** để auto-scale số lượng containers của API Server.
- **Traffic:** Dùng **Cloudflare** làm CDN và Load Balancer (chống DDoS cơ bản).
- **Database:** Neon đã tự scale phần Compute. Cân nhắc tách **Read/Write separation** trong code NestJS để tận dụng Read Replica của Neon.
- **Queue (Worker):** **Redis BullMQ** (tự host) hoặc **AWS SQS** để xử lý đơn hàng/email không đồng bộ.

### Cấp độ 3 & 4: Scale & Enterprise (Isolation & Security)

Mục tiêu: Bảo mật cao, không downtime, cô lập khách hàng lớn.

- **Microservices Orchestration:** **Kubernetes (K8s)**. Đây là lúc K8s tỏa sáng để quản lý hàng trăm services nhỏ và config map phức tạp.
- **IaC (Infrastructure as Code):** Dùng **Terraform** để dựng toàn bộ hạ tầng. Không click tay trên Web Console nữa.
- **Multi-tenancy Infra:**
  - _Tenant Nhỏ:_ Chạy chung cluster K8s, chung Database Neon (Shared Schema).
  - _Tenant VIP:_ Có Namespace K8s riêng (Resource Quota riêng), Database Neon Project riêng.
- **Observability:** **Datadog** hoặc **Prometheus/Grafana** để soi từng query, CPU usage của từng Tenant.

### Tóm tắt Mapping Component vào Cloud:

| Component          | Cấp độ 1 (Startup)    | Cấp độ 3 (Scale)             |
| :----------------- | :-------------------- | :--------------------------- |
| **API Server**     | Docker Compose / PaaS | Kubernetes (EKS/GKE)         |
| **Database**       | Neon (Shared DB)      | Neon (DB per Tenant cho VIP) |
| **File Storage**   | AWS S3                | AWS S3 + CloudFront (CDN)    |
| **Background Job** | Node.js Process       | AWS SQS / Kafka              |
| **Logs**           | Console Log           | ELK Stack / Loki             |

---

## 6. Feature Roadmap & Strategies

### 6.1 Demo Tenant Strategy (Trial Experience)

Để hỗ trợ user trải nghiệm nhanh ("Click là có Store"), hệ thống sẽ áp dụng chiến lược **Template Cloning**:

1.  **Master Template**:
    - Tạo sẵn một Tenant mẫu (ID: `template-v1`) với đầy đủ dữ liệu demo (Categories, Products, Banners, Settings).
    - Dữ liệu này được curation kỹ lưỡng để show-case hết tính năng theme.
2.  **Fast Cloning Process**:
    - Khi user đăng ký Trial, tạo `Tenant` mới với gói `Plan: DEMO`.
    - Sử dụng **Prisma Transactions** hoặc **Postgres Functions** để sao chép dữ liệu từ `template-v1` sang tenant mới.
    - **Scope Copy**: Chỉ copy Catalog & CMS. Không copy Customer/Order (để user tự trải nghiệm quy trình bán hàng).
3.  **Ephemeral Lifecycle (Vòng đời ngắn)**:
    - Demo Tenant có `expiresAt` (ví dụ: 24h hoặc 3 ngày).
    - **Cleanup Job**: Cron job chạy định kỳ (`0 0 * * *`) để xóa cứng (Hard Delete) các Tenant hết hạn nhằm giải phóng tài nguyên.
