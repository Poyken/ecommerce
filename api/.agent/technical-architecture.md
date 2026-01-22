# Tài Liệu Kiến Trúc Kỹ Thuật API - Ecommerce Platform

## Tổng Quan Kiến Trúc

### Architecture Pattern: Modular Monolith
- **Pattern**: Modular Monolith với Domain-Driven Design (DDD)
- **Multi-tenancy**: Shared Database với Row-Level Security
- **Scalability**: Horizontal scaling với stateless services
- **Isolation**: Module boundaries với dependency injection

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                      │
├─────────────────────────────────────────────────────────────┤
│                  NestJS Application                        │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   Platform  │   Identity  │   Catalog   │    Sales    │ │
│  │   Module    │   Module    │   Module    │   Module    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ Operations  │  Marketing  │     CMS     │ Notifications│ │
│  │   Module    │   Module    │   Module    │   Module    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                     │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   Core      │   Database  │    Cache    │    Queue    │ │
│  │  Services   │ (PostgreSQL) │   (Redis)   │  (BullMQ)   │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 External Services                          │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ Cloudinary  │   Email     │   Payment   │   Social    │ │
│  │  (Storage)  │ (Nodemailer) │  Gateway    │   OAuth     │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Module Architecture

### 1. Core Infrastructure

#### Database Layer
```typescript
// Prisma ORM với Multi-tenancy
model User {
  id         String   @id @default(uuid())
  email      String
  tenantId   String   // Row-Level Security
  // ... fields
  
  @@map("users")
  @@index([tenantId]) // Multi-tenant index
}

// Row-Level Security Policy
CREATE POLICY tenant_isolation ON users
  FOR ALL TO authenticated_user
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### Caching Strategy
- **L1 Cache**: In-memory cache (Redis) - TTL: 5-15 minutes
- **L2 Cache**: Database query cache - TTL: 1-5 minutes
- **Cache Invalidation**: Event-driven với NestJS EventEmitter
- **Cache Patterns**: Cache-Aside, Write-Through, Write-Behind

#### Queue System
```typescript
// BullMQ với Redis backend
@Processor('notifications')
export class NotificationProcessor {
  @Process('send-email')
  async sendEmail(job: Job<EmailData>) {
    // Email processing logic
  }
  
  @Process('send-sms')
  async sendSMS(job: Job<SMSData>) {
    // SMS processing logic
  }
}
```

### 2. Domain Modules

#### Identity Module
```typescript
// Authentication Architecture
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '7d' },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
  ],
})
export class AuthModule {}

// RBAC Implementation
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

#### Catalog Module
```typescript
// Product Architecture
@Entity()
export class Product {
  @PrimaryGeneratedId('uuid')
  id: string;
  
  @Column()
  tenantId: string;
  
  @Column()
  name: string;
  
  @Column('jsonb')
  attributes: ProductAttribute[];
  
  @OneToMany(() => ProductVariant, variant => variant.product)
  variants: ProductVariant[];
  
  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[];
}

// Repository Pattern
@Injectable()
export class ProductRepository {
  constructor(private prisma: PrismaService) {}
  
  async findByTenant(tenantId: string, filters: ProductFilters): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { tenantId, ...filters },
      include: { variants: true, categories: true },
    });
  }
}
```

#### Sales Module
```typescript
// Order Processing Architecture
@Injectable()
export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private paymentService: PaymentService,
    private inventoryService: InventoryService,
    private eventEmitter: EventEmitter2,
  ) {}
  
  @Transaction()
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // 1. Create order
    const order = await this.orderRepository.create(createOrderDto);
    
    // 2. Process payment
    const payment = await this.paymentService.processPayment(order);
    
    // 3. Update inventory
    await this.inventoryService.reserveItems(order.items);
    
    // 4. Emit events
    this.eventEmitter.emit('order.created', { orderId: order.id });
    
    return order;
  }
}
```

### 3. Cross-Cutting Concerns

#### Security Architecture
```typescript
// Multi-layer Security
@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // 1. Rate limiting
    // 2. Input validation
    // 3. SQL injection prevention
    // 4. XSS protection
    // 5. CSRF protection
    
    return next.handle();
  }
}

// Data Validation với Zod
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  attributes: z.record(z.any()).optional(),
});
```

#### Error Handling Architecture
```typescript
// Global Exception Filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = 500;
    let message = 'Internal server error';
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }
    
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
```

## Data Architecture

### Database Design

#### Multi-tenancy Strategy
```sql
-- Shared Database with Row-Level Security
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  -- ... other fields
);

-- RLSP Policy
CREATE POLICY tenant_isolation ON users
  FOR ALL
  TO authenticated_user
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Index cho multi-tenant queries
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
```

#### Schema Design Patterns
```sql
-- Product Catalog Schema
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT products_unique_tenant_slug UNIQUE (tenant_id, slug)
);

-- Product Variants (Strategy Pattern)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  sku VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  inventory_count INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  
  CONSTRAINT variants_unique_tenant_sku UNIQUE (tenant_id, sku)
);
```

### Data Flow Architecture

#### Command Query Responsibility Segregation (CQRS)
```typescript
// Command Side (Write Operations)
@CommandHandler(CreateProductCommand)
export class CreateProductHandler {
  constructor(private repository: ProductRepository) {}
  
  async execute(command: CreateProductCommand): Promise<Product> {
    const product = Product.create(command.data);
    return this.repository.save(product);
  }
}

// Query Side (Read Operations)
@QueryHandler(GetProductsQuery)
export class GetProductsHandler {
  constructor(private repository: ProductReadRepository) {}
  
  async execute(query: GetProductsQuery): Promise<Product[]> {
    return this.repository.findByFilters(query.filters);
  }
}
```

#### Event-Driven Architecture
```typescript
// Domain Events
export class ProductCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly tenantId: string,
    public readonly data: any,
  ) {}
}

// Event Handlers
@EventsHandler(ProductCreatedEvent)
export class ProductCreatedHandler {
  constructor(private cacheService: CacheService) {}
  
  async handle(event: ProductCreatedEvent) {
    // Invalidate cache
    await this.cacheService.invalidate(`products:${event.tenantId}:*`);
    
    // Send notifications
    // Update search index
    // Log analytics
  }
}
```

## Integration Architecture

### External Service Integration

#### Payment Gateway Integration
```typescript
// Strategy Pattern cho Payment Providers
interface PaymentProvider {
  processPayment(payment: PaymentData): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount: number): Promise<RefundResult>;
}

@Injectable()
export class StripeProvider implements PaymentProvider {
  async processPayment(payment: PaymentData): Promise<PaymentResult> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    return stripe.charges.create({
      amount: payment.amount * 100,
      currency: 'usd',
      source: payment.source,
    });
  }
}

// Payment Service với Dependency Injection
@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENT_PROVIDER') private provider: PaymentProvider,
  ) {}
  
  async processPayment(payment: PaymentData): Promise<PaymentResult> {
    return this.provider.processPayment(payment);
  }
}
```

#### File Storage Integration
```typescript
// Cloudinary Integration
@Injectable()
export class CloudinaryService {
  private cloudinary: v2;

  constructor() {
    this.cloudinary = v2;
    this.cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.cloudinary.uploader.upload(file.path, {
      folder: `tenant-${currentTenantId}`,
      resource_type: 'auto',
    });
  }
}
```

## Performance Architecture

### Caching Architecture
```typescript
// Multi-level Caching
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // L1: Redis cache
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    // L2: Memory cache
    const memoryCached = await this.cacheManager.get(key);
    if (memoryCached) {
      await this.redis.setex(key, 300, JSON.stringify(memoryCached));
      return memoryCached;
    }

    return null;
  }
}
```

### Database Optimization
```typescript
// Connection Pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Query Optimization
@Injectable()
export class OptimizedProductRepository {
  async findWithPagination(
    tenantId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<Product>> {
    return this.prisma.product.findMany({
      where: { tenantId },
      include: {
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            inventory_count: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: options.offset,
      take: options.limit,
    });
  }
}
```

## Security Architecture

### Authentication & Authorization
```typescript
// JWT Token Structure
interface JWTPayload {
  sub: string;      // User ID
  tenantId: string; // Tenant ID
  roles: string[];  // User roles
  permissions: string[];
  iat: number;      // Issued at
  exp: number;      // Expiration
}

// Role-Based Access Control
@Injectable()
export class RBACGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    
    const user = context.switchToHttp().getRequest().user;
    
    return requiredPermissions.every(permission =>
      user.permissions.includes(permission),
    );
  }
}
```

### Data Protection
```typescript
// Input Validation Pipeline
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    
    return object;
  }
}

// Data Encryption
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
}
```

## Monitoring & Observability

### Logging Architecture
```typescript
// Structured Logging
@Injectable()
export class LoggerService {
  private logger = new Logger();

  logWithContext(message: string, context: any) {
    this.logger.log(message, {
      timestamp: new Date().toISOString(),
      context,
      traceId: context.traceId,
      userId: context.userId,
      tenantId: context.tenantId,
    });
  }
}
```

### Metrics Collection
```typescript
// Custom Metrics
@Injectable()
export class MetricsService {
  private requestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private requestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests',
    labelNames: ['method', 'route'],
  });

  recordRequest(method: string, route: string, statusCode: number, duration: number) {
    this.requestCounter.inc({ method, route, status_code: statusCode });
    this.requestDuration.observe({ method, route }, duration / 1000);
  }
}
```

## Scalability Architecture

### Horizontal Scaling
```typescript
// Stateless Service Design
@Injectable()
export class StatelessService {
  // No in-memory state
  // All state stored in external systems (Redis, Database)
  
  async processData(data: any): Promise<any> {
    // Process without maintaining state
    return this.transform(data);
  }
}

// Load Balancer Configuration
// Nginx upstream configuration
upstream api_backend {
  least_conn;
  server api1:8080 weight=1 max_fails=3 fail_timeout=30s;
  server api2:8080 weight=1 max_fails=3 fail_timeout=30s;
  server api3:8080 weight=1 max_fails=3 fail_timeout=30s;
}
```

### Database Scaling
```typescript
// Read Replicas
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Read replica configuration
  readReplicas: {
    url: process.env.DATABASE_READ_REPLICA_URL,
  },
});

// Database Sharding Strategy
@Injectable()
export class ShardingService {
  getShardKey(tenantId: string): string {
    // Consistent hashing for shard distribution
    return this.consistentHash(tenantId);
  }
  
  async getShardConnection(shardKey: string): Promise<PrismaClient> {
    return this.shardConnections[shardKey];
  }
}
```

## Design Decisions & Trade-offs

### Architecture Decisions

1. **Modular Monolith vs Microservices**
   - **Decision**: Modular Monolith
   - **Rationale**: Simpler deployment, easier debugging, lower operational overhead
   - **Trade-off**: Less independent scaling, tighter coupling between modules

2. **Shared Database vs Database per Tenant**
   - **Decision**: Shared Database with Row-Level Security
   - **Rationale**: Cost-effective, easier maintenance, unified backups
   - **Trade-off**: Potential performance impact, security complexity

3. **SQL vs NoSQL**
   - **Decision**: PostgreSQL (SQL) with JSONB support
   - **Rationale**: ACID compliance, complex queries, mature ecosystem
   - **Trade-off**: Less flexible schema, potential scaling limitations

4. **ORM vs Raw Queries**
   - **Decision**: Prisma ORM
   - **Rationale**: Type safety, migrations, developer productivity
   - **Trade-off**: Performance overhead, learning curve

5. **Caching Strategy**
   - **Decision**: Multi-level caching (Redis + Memory)
   - **Rationale**: Performance optimization, reduced database load
   - **Trade-off**: Complexity, cache invalidation challenges

### Performance Considerations

1. **Database Indexing Strategy**
   - Composite indexes for multi-tenant queries
   - Partial indexes for filtered queries
   - JSONB indexes for flexible attributes

2. **Query Optimization**
   - N+1 query prevention with dataloader
   - Connection pooling with Prisma
   - Read replicas for read-heavy operations

3. **Caching Layers**
   - Application-level caching with Redis
   - Database query caching
   - CDN for static assets

### Security Considerations

1. **Multi-tenant Isolation**
   - Row-Level Security policies
   - Tenant context validation
   - Resource quota enforcement

2. **Data Protection**
   - Encryption at rest and in transit
   - Input validation and sanitization
   - Audit logging for compliance

3. **Authentication & Authorization**
   - JWT with refresh tokens
   - Role-based access control
   - OAuth 2.0 integration

## Future Scalability Roadmap

### Phase 1: Optimization (Current)
- Database query optimization
- Caching layer enhancement
- Performance monitoring

### Phase 2: Scaling
- Horizontal scaling with load balancers
- Database read replicas
- Microservice extraction for high-load modules

### Phase 3: Advanced Features
- Event-driven architecture with Kafka
- CQRS implementation
- Database sharding for massive scale

### Phase 4: Cloud Native
- Container orchestration with Kubernetes
- Service mesh with Istio
- Serverless functions for burst workloads
