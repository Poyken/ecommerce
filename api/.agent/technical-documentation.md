# Tài Liệu Kỹ Thuật API - Ecommerce Platform

## Tổng Quan

API được xây dựng trên kiến trúc **Modular Monolith** sử dụng NestJS framework, thiết kế theo mô hình **Multi-tenant SaaS** với chiến lược Shared Database và Row-Level Security.

### Công Nghệ Chính

- **Framework**: NestJS 11+
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL 15+ với PGVector extension
- **ORM**: Prisma 6.19.0
- **Cache**: Redis (Cache Manager)
- **Queue**: BullMQ (Redis)
- **Authentication**: JWT + Passport
- **File Storage**: Cloudinary
- **Documentation**: Swagger/OpenAPI
- **Validation**: Zod
- **Testing**: Jest + Supertest

## Kiến Trúc Module

### Core Modules

```
src/
├── core/                    # Infrastructure & Shared Components
│   ├── config/             # Configuration management
│   ├── database/           # Prisma client & connection
│   ├── guards/             # Authentication & Authorization guards
│   ├── interceptors/       # Request/Response interceptors
│   ├── decorators/         # Custom decorators
│   └── utils/              # Shared utilities
├── platform/               # SaaS Platform Management
│   ├── admin/              # Platform administration
│   ├── analytics/          # Analytics & reporting
│   ├── subscriptions/      # Subscription management
│   └── tenants/            # Tenant management
├── identity/               # Authentication & Authorization
│   ├── auth/               # Authentication logic
│   ├── users/              # User management
│   ├── roles/              # Role-based access control
│   ├── permissions/        # Permission management
│   └── tenants/            # Tenant-specific identity
├── catalog/                # Product Catalog Management
│   ├── products/           # Product CRUD operations
│   ├── categories/         # Category hierarchy
│   ├── brands/             # Brand management
│   ├── attributes/         # Product attributes
│   └── reviews/            # Product reviews
├── sales/                  # Sales & Order Management
│   ├── orders/             # Order processing
│   ├── cart/               # Shopping cart
│   ├── payments/           # Payment processing
│   ├── checkout/           # Checkout flow
│   └── tax/                # Tax calculations
├── operations/             # Operations & Logistics
│   ├── inventory/          # Inventory management
│   ├── fulfillment/        # Order fulfillment
│   ├── shipping/           # Shipping management
│   └── returns/            # Return processing
├── marketing/              # Marketing & Promotions
│   ├── promotions/         # Discount campaigns
│   ├── coupons/            # Coupon management
│   ├── loyalty/            # Loyalty programs
│   └── analytics/          # Marketing analytics
├── cms/                    # Content Management
│   ├── blog/               # Blog management
│   ├── pages/              # Static pages
│   └── media/              # Media assets
├── notifications/          # Notification System
│   ├── email/              # Email notifications
│   ├── push/               # Push notifications
│   └── sms/                # SMS notifications
├── chat/                   # Real-time Chat
│   ├── conversations/      # Chat sessions
│   └── messages/           # Message handling
└── ai/                     # AI Integration
    ├── search/             # AI-powered search
    ├── recommendations/    # Product recommendations
    └── chatbot/            # AI chatbot
```

## Database Schema

### Core Entities

#### User & Identity
- **User**: Thông tin người dùng cơ bản
- **Tenant**: Thông tin tenant cho multi-tenancy
- **Role**: Vai trò người dùng
- **Permission**: Quyền hệ thống
- **UserPermission**: Phân quyền chi tiết

#### Catalog
- **Product**: Sản phẩm với variants
- **Category**: Danh mục phân cấp
- **Brand**: Thương hiệu
- **ProductAttribute**: Thuộc tính sản phẩm
- **Review**: Đánh giá sản phẩm

#### Sales
- **Order**: Đơn hàng
- **OrderItem**: Chi tiết đơn hàng
- **Cart**: Giỏ hàng
- **CartItem**: Mục giỏ hàng
- **Payment**: Thanh toán

#### Operations
- **Inventory**: Tồn kho
- **Warehouse**: Kho hàng
- **Shipment**: Vận chuyển
- **ReturnRequest**: Yêu cầu trả hàng

### Multi-tenancy Implementation

Sử dụng Row-Level Security với các trường:
- `tenantId`: Bắt buộc trên tất cả entities
- Soft delete với `deletedAt`
- Audit trails với `createdAt`, `updatedAt`

## API Design Patterns

### 1. Repository Pattern
```typescript
// Abstract repository interface
abstract class BaseRepository<T> {
  abstract create(data: PrismaCreateInput<T>): Promise<T>
  abstract findById(id: string): Promise<T | null>
  abstract findMany(params: FindManyParams<T>): Promise<T[]>
  abstract update(id: string, data: PrismaUpdateInput<T>): Promise<T>
  abstract delete(id: string): Promise<T>
}
```

### 2. Service Layer Pattern
```typescript
@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cacheService: CacheService,
  ) {}

  async createProduct(data: CreateProductDto): Promise<Product> {
    const product = await this.productRepository.create(data)
    await this.cacheService.invalidate(`products:*`)
    return product
  }
}
```

### 3. CQRS Pattern (Partial)
```typescript
// Command for write operations
@Command()
export class CreateProductCommand {
  constructor(public readonly data: CreateProductDto) {}
}

// Query for read operations
@Query()
export class GetProductQuery {
  constructor(public readonly id: string) {}
}
```

## Security Implementation

### Authentication Flow
1. **Local Authentication**: Email/Password với bcrypt
2. **Social OAuth**: Google, Facebook integration
3. **JWT Tokens**: Access + Refresh token pattern
4. **Two-Factor Authentication**: TOTP với otplib

### Authorization
- **Role-Based Access Control (RBAC)**
- **Resource-based permissions**
- **Tenant isolation** với row-level security
- **IP whitelisting** cho admin accounts

### Security Headers
```typescript
// Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))
```

## Performance Optimizations

### 1. Caching Strategy
- **L1 Cache**: In-memory cache (Redis)
- **L2 Cache**: Database query cache
- **Cache invalidation**: Event-driven với NestJS EventEmitter

### 2. Database Optimizations
- **Connection pooling** với Prisma
- **Query optimization** với proper indexing
- **N+1 query prevention** với dataloader
- **Read replicas** cho high-traffic queries

### 3. Background Jobs
```typescript
@Processor('notifications')
export class NotificationProcessor {
  @Process('send-email')
  async sendEmail(job: Job<EmailData>) {
    // Email sending logic
  }
}
```

## Error Handling

### Global Exception Filter
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Centralized error handling
    // Logging, monitoring, response formatting
  }
}
```

### Error Response Format
```typescript
interface ErrorResponse {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
  requestId: string
}
```

## Testing Strategy

### Unit Tests
- Jest framework
- Mock external dependencies
- Test individual services and utilities

### Integration Tests
- Database testing với test containers
- API endpoint testing
- Repository pattern testing

### E2E Tests
- Complete user flows
- Multi-tenant scenarios
- Performance testing

## Monitoring & Logging

### Structured Logging
```typescript
// Winston configuration
const logger = WinstonModule.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
})
```

### Metrics Collection
- **Sentry** cho error tracking
- **Custom metrics** cho business KPIs
- **Health checks** cho service monitoring

## Deployment

### Docker Configuration
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
# Build stage

FROM node:20-alpine AS runtime
# Runtime stage
```

### Environment Variables
```bash
# Core configuration
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
CLOUDINARY_URL=cloudinary://...

# Feature flags
ENABLE_AI_FEATURES=true
ENABLE_SOCIAL_LOGIN=true
```

## Development Workflow

### Local Development
```bash
# Start development
npm run start:dev

# Database migrations
npx prisma migrate dev

# Seed data
npm run seed
```

### Code Quality
- **ESLint** với strict rules
- **Prettier** cho code formatting
- **Husky** cho git hooks
- **Conventional commits** cho versioning

## API Documentation

### Swagger Integration
```typescript
// Swagger configuration
const config = new DocumentBuilder()
  .setTitle('Ecommerce API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
```

### API Versioning
- URL-based versioning: `/api/v1/`
- Backward compatibility maintained
- Deprecation warnings for old versions

## Scalability Considerations

### Horizontal Scaling
- **Stateless services** design
- **Load balancer** ready
- **Database connection pooling**
- **Redis clustering** cho cache

### Performance Monitoring
- **Response time tracking**
- **Database query performance**
- **Cache hit ratios**
- **Error rates and patterns**

## Hướng Dẫn Vận Hành Chi Tiết

### 1. Cài Đặt Môi Trường

#### Yêu Cầu Hệ Thống
- **Node.js**: 20.x hoặc cao hơn
- **PostgreSQL**: 15+ với PGVector extension
- **Redis**: 7.x hoặc cao hơn
- **Docker**: 20.x (cho development)
- **RAM**: Tối thiểu 4GB, khuyến nghị 8GB
- **Disk**: Tối thiểu 20GB available space

#### Cài Đặt Step-by-Step

```bash
# 1. Clone repository
git clone <repository-url>
cd ecommerce-main/api

# 2. Cài đặt dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Cấu hình environment variables
nano .env
```

#### Cấu Trúc .env Chi Tiết

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ecommerce_db

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application Configuration
PORT=8080
NODE_ENV=development
API_VERSION=v1

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_SOCIAL_LOGIN=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_TWO_FACTOR_AUTH=true
```

### 2. Database Setup

#### Khởi Tạo Database

```bash
# 1. Start PostgreSQL và Redis với Docker
docker-compose up -d postgres redis

# 2. Chờ cho services sẵn sàng
sleep 10

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Generate Prisma client
npx prisma generate

# 5. Seed initial data
npm run seed
```

#### Database Schema Management

```bash
# Tạo migration mới
npx prisma migrate dev --name <migration-name>

# Apply migrations cho production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database
npx prisma studio
```

#### Seed Data Chi Tiết

```typescript
// prisma/seed.ts
async function main() {
  // 1. Create default tenant
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: 'Default Tenant',
      subdomain: 'demo',
      settings: {},
      isActive: true,
    },
  });

  // 2. Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'User',
      password: await bcrypt.hash('admin123', 12),
      tenantId: defaultTenant.id,
      roles: {
        create: {
          role: {
            connectOrCreate: {
              where: { name: 'SUPER_ADMIN' },
              create: {
                name: 'SUPER_ADMIN',
                description: 'Super Administrator',
                permissions: {
                  create: [
                    { permission: { connect: { name: 'ALL' } } }
                  ]
                }
              }
            }
          }
        }
      }
    },
  });

  // 3. Create default categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics',
        slug: 'electronics',
        tenantId: defaultTenant.id,
      },
    }),
    // ... more categories
  ]);

  console.log('Database seeded successfully!');
}
```

### 3. Development Workflow

#### Start Development Server

```bash
# Development mode với hot reload
npm run start:dev

# Debug mode
npm run start:debug

# Build và start production
npm run build
npm run start:prod
```

#### Common Development Commands

```bash
# Linting và formatting
npm run lint
npm run format

# Testing
npm run test              # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:cov         # Coverage report

# Database operations
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data
npm run db:studio        # Open Prisma Studio

# Cache operations
npm run cache:clear      # Clear Redis cache

# Build operations
npm run build            # Build for production
npm run build:seeds      # Build seed files
```

### 4. API Operations Guide

#### Authentication Flow

```typescript
// 1. User Registration
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

// 2. Email Verification
POST /api/v1/auth/verify-email
{
  "token": "verification-token"
}

// 3. Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response:
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": { ... }
}
```

#### Product Management

```typescript
// Create Product
POST /api/v1/products
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "categoryId": "category-id",
  "brandId": "brand-id",
  "images": [file1, file2],
  "attributes": {
    "color": "red",
    "size": "M"
  }
}

// Get Products with Filters
GET /api/v1/products?category=electronics&page=1&limit=20&sort=price:asc

// Update Product
PUT /api/v1/products/:id
Authorization: Bearer <access-token>

// Delete Product
DELETE /api/v1/products/:id
Authorization: Bearer <access-token>
```

#### Order Processing

```typescript
// Create Order
POST /api/v1/orders
Authorization: Bearer <access-token>
{
  "items": [
    {
      "productId": "product-id",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA",
    "postalCode": "10001"
  }
}

// Process Payment
POST /api/v1/orders/:id/payment
{
  "paymentMethod": "credit_card",
  "cardDetails": {
    "number": "4242424242424242",
    "expiry": "12/25",
    "cvv": "123"
  }
}
```

### 5. Monitoring & Maintenance

#### Health Checks

```bash
# Application health
curl http://localhost:8080/health

# Database health
curl http://localhost:8080/health/database

# Redis health
curl http://localhost:8080/health/redis
```

#### Log Management

```typescript
// Log levels và structured logging
import { Logger } from '@nestjs/common';

const logger = new Logger('UserService');

logger.log('User created successfully', { userId: '123', tenantId: '456' });
logger.warn('User login attempt failed', { email: 'user@example.com' });
logger.error('Database connection failed', error);
```

#### Performance Monitoring

```bash
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/api/v1/products

# Database query performance
npx prisma db execute --sql "EXPLAIN ANALYZE SELECT * FROM products WHERE tenant_id = '123'"

# Redis performance
redis-cli --latency-history
```

### 6. Troubleshooting Guide

#### Common Issues và Solutions

**Issue 1: Database Connection Failed**
```bash
# Kiểm tra PostgreSQL status
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Verify connection string
psql "postgresql://username:password@localhost:5432/ecommerce_db"
```

**Issue 2: Redis Connection Failed**
```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
redis-cli ping

# Clear Redis cache
redis-cli flushall
```

**Issue 3: JWT Token Invalid**
```bash
# Verify JWT secret
echo $JWT_SECRET

# Check token expiration
node -e "console.log(JSON.parse(Buffer.from('jwt-payload', 'base64').toString()))"
```

**Issue 4: File Upload Failed**
```bash
# Check Cloudinary credentials
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY

# Test upload manually
curl -X POST https://api.cloudinary.com/v1_1/cloud-name/image/upload \
  -F "file=@test.jpg" \
  -F "api_key=your-api-key" \
  -F "timestamp=$(date +%s)" \
  -F "signature=generated-signature"
```

#### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run start:dev

# Database query debug
DEBUG=prisma:query npm run start:dev

# HTTP request debug
DEBUG=http npm run start:dev
```

### 7. Backup & Recovery

#### Database Backup

```bash
# Create backup
pg_dump -h localhost -U postgres -d ecommerce_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -h localhost -U postgres -d ecommerce_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore database
psql -h localhost -U postgres -d ecommerce_db < backup_file.sql

# Restore from compressed backup
gunzip -c backup_file.sql.gz | psql -h localhost -U postgres -d ecommerce_db
```

#### Redis Backup

```bash
# Create Redis backup
redis-cli BGSAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backup/redis_$(date +%Y%m%d_%H%M%S).rdb

# Restore Redis
redis-cli FLUSHALL
redis-cli --rdb /backup/redis_dump.rdb
```

### 8. Security Operations

#### Security Checklist

```bash
# 1. Rotate secrets regularly
npm run security:rotate-secrets

# 2. Update dependencies
npm audit fix
npm update

# 3. Check for vulnerabilities
npm audit

# 4. Validate SSL certificates
openssl s_client -connect localhost:8080 -servername localhost
```

#### Rate Limiting Configuration

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
})
export class AppModule {}
```

### 9. Deployment Procedures

#### Production Deployment

```bash
# 1. Build application
npm run build

# 2. Run database migrations
npx prisma migrate deploy

# 3. Start production server
npm run start:prod

# 4. Verify deployment
curl http://localhost:8080/health
```

#### Docker Deployment

```bash
# Build Docker image
docker build -t ecommerce-api .

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

## Best Practices

### Performance Best Practices

1. **Database Optimization**
   - Sử dụng proper indexes
   - Implement connection pooling
   - Use read replicas cho read-heavy operations

2. **Caching Strategy**
   - Cache frequently accessed data
   - Implement cache invalidation
   - Use Redis clustering cho scalability

3. **API Design**
   - Implement pagination
   - Use compression cho responses
   - Optimize query patterns

### Security Best Practices

1. **Authentication & Authorization**
   - Implement proper JWT handling
   - Use secure cookie settings
   - Implement rate limiting

2. **Data Protection**
   - Validate all inputs
   - Sanitize outputs
   - Implement proper error handling

3. **Infrastructure Security**
   - Use HTTPS everywhere
   - Implement proper headers
   - Regular security audits
