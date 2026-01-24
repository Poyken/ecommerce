# Tài liệu Kiến trúc Bảo mật
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Bảo mật  
**Trạng thái**: Bản nháp  

---

### Tổng quan về Kiến trúc Bảo mật

#### Triết lý Bảo mật

1. **Phòng thủ theo lớp**: Nhiều lớp kiểm soát bảo mật
2. **Zero Trust**: Không bao giờ tin tưởng, luôn xác minh
3. **Bảo mật theo Thiết kế**: Bảo mật tích hợp ngay từ đầu
4. **Riêng tư theo Mặc định**: Bảo vệ dữ liệu là nguyên tắc cốt lõi
5. **Giám sát Liên tục**: Phát hiện và phản hồi mối đe dọa chủ động

#### Mục tiêu Bảo mật

- **Bảo mật**: Bảo vệ dữ liệu nhạy cảm khỏi truy cập trái phép
- **Toàn vẹn**: Đảm bảo tính chính xác và đầy đủ của dữ liệu
- **Khả dụng**: Duy trì thời gian hoạt động và hiệu suất hệ thống
- **Khả năng kiểm tra**: Theo dõi và ghi lại tất cả sự kiện bảo mật liên quan
- **Tuân thủ**: Đáp ứng các yêu cầu quy định (GDPR, PCI-DSS, SOC 2)

---

### Phân tích Mô hình Mối đe dọa

#### Phân loại Mối đe dọa

| Phân loại | Mô tả | Tác động | Khả năng |
|-----------|-------|----------|----------|
| **Xác thực Bỏ qua** | Truy cập trái phép vào tài khoản người dùng | Cao | Trung bình |
| **Rò rỉ Dữ liệu** | Tiết lộ dữ liệu khách hàng nhạy cảm | Nghiêm trọng | Trung bình |
| **Tấn công Injection** | SQL injection, XSS, command injection | Cao | Cao |
| **Từ chối Dịch vụ** | Quá tải hệ thống và không khả dụng | Trung bình | Cao |
| **Nâng cao Quyền** | Có được quyền quản trị trái phép | Cao | Trung bình |
| **Làm giả Dữ liệu** | Sửa đổi dữ liệu trái phép | Cao | Thấp |
| **Người nghe Bí mật** | Chặn bắt các cuộc liên lạc | Trung bình | Thấp |

#### Phân tích Bề mặt Tấn công

```
┌─────────────────────────────────────────────────────────────────┐
│                    Attack Surface Areas                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Web Application (Next.js)                                    │
│    ├─ XSS Protection                                            │
│    ├─ CSRF Protection                                           │
│    ├─ Content Security Policy                                   │
│    └─ Input Validation                                          │
│                                                                 │
│ 2. API Gateway (NestJS)                                        │
│    ├─ Rate Limiting                                             │
│    ├─ API Authentication                                        │
│    ├─ Request Validation                                        │
│    └─ API Throttling                                           │
│                                                                 │
│ 3. Database Layer (PostgreSQL)                                 │
│    ├─ SQL Injection Prevention                                  │
│    ├─ Database Encryption                                       │
│    ├─ Access Control                                            │
│    └─ Audit Logging                                             │
│                                                                 │
│ 4. Infrastructure (Docker/Cloud)                               │
│    ├─ Network Security                                          │
│    ├─ Container Security                                         │
│    ├─ Cloud Configuration                                       │
│    └─ Secret Management                                         │
│                                                                 │
│ 5. Third-party Integrations                                     │
│    ├─ Payment Gateways                                          │
│    ├─ Email Services                                            │
│    ├─ Shipping APIs                                             │
│    └─ Analytics Services                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### Security Controls Implementation

#### Authentication & Authorization

**Multi-Factor Authentication (MFA)**:
```typescript
// MFA Implementation
interface MFAConfig {
  totpEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  backupCodes: string[];
}

class AuthenticationService {
  async authenticateWithMFA(
    credentials: LoginCredentials,
    mfaToken?: string
  ): Promise<AuthResult> {
    // 1. Primary authentication
    const user = await this.validateCredentials(credentials);
    
    // 2. MFA verification if enabled
    if (user.mfaEnabled) {
      await this.verifyMFAToken(user.id, mfaToken);
    }
    
    // 3. Generate secure tokens
    return this.generateTokens(user);
  }
}
```

**Role-Based Access Control (RBAC)**:
```typescript
// RBAC Implementation
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface Role {
  name: string;
  permissions: Permission[];
  inherits?: string[];
}

@Guard(() => RolesGuard)
@SetMetadata('roles', ['admin', 'manager'])
@Controller('products')
export class ProductsController {
  @Post()
  @SetMetadata('permissions', ['product:create'])
  async createProduct(@Body() productData: CreateProductDto) {
    // Implementation
  }
}
```

#### Data Protection

**Encryption at Rest**:
```sql
-- Database encryption configuration
-- Enable transparent data encryption
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';

-- Column-level encryption for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
ALTER TABLE users 
ADD COLUMN encrypted_email BYTEA,
ADD COLUMN encrypted_phone BYTEA;

-- Encryption functions
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;
```

**Encryption in Transit**:
```typescript
// TLS Configuration
import * as https from 'https';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: fs.readFileSync('./secrets/server.key'),
      cert: fs.readFileSync('./secrets/server.crt'),
      ca: fs.readFileSync('./secrets/ca.crt'),
      minVersion: 'TLSv1.2',
      ciphers: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES128-SHA256'
      ]
    }
  });
}
```

#### Input Validation & Sanitization

**API Input Validation**:
```typescript
// DTO with validation decorators
import { IsEmail, IsString, MinLength, ValidateNested } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }: TransformFnParams) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character'
  })
  password: string;

  @IsString()
  @Transform(({ value }: TransformFnParams) => sanitizeHtml(value))
  firstName: string;

  @IsString()
  @Transform(({ value }: TransformFnParams) => sanitizeHtml(value))
  lastName: string;
}
```

**XSS Protection**:
```typescript
// Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);
```

---

### Multi-Tenant Security

#### Tenant Isolation

**Row Level Security (RLS)**:
```sql
-- Enable RLS for all tenant-specific tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_policy ON products
FOR ALL
USING (tenantId = current_setting('app.current_tenant_id')::UUID)
WITH CHECK (tenantId = current_setting('app.current_tenant_id')::UUID);

-- Apply policy to all tables
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('tenants', 'users', 'migrations')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %I
            FOR ALL
            USING (tenantId = current_setting(''app.current_tenant_id'')::UUID)
            WITH CHECK (tenantId = current_setting(''app.current_tenant_id'')::UUID)
        ', table_name);
    END LOOP;
END $$;
```

**Tenant Context Middleware**:
```typescript
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);
    
    if (!tenantId) {
      throw new UnauthorizedException('Tenant not specified');
    }

    // Validate tenant exists and is active
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedException('Invalid or inactive tenant');
    }

    // Set tenant context for database queries
    req['tenantId'] = tenantId;
    req['tenant'] = tenant;

    // Set PostgreSQL session variable for RLS
    await this.prisma.$executeRaw`
      SET app.current_tenant_id = ${tenantId}
    `;

    next();
  }

  private extractTenantId(req: Request): string {
    // Extract from subdomain, header, or JWT
    return req.headers['x-tenant-id'] as string || 
           req.subdomains[0] || 
           req.user?.tenantId;
  }
}
```

#### Data Segregation

**Database Schema Isolation**:
```sql
-- Schema-based isolation for sensitive data
CREATE SCHEMA tenant_${tenant_id}_sensitive;

-- Move sensitive tables to tenant-specific schema
ALTER TABLE payment_methods SET SCHEMA tenant_${tenant_id}_sensitive;
ALTER TABLE customer_pii SET SCHEMA tenant_${tenant_id}_sensitive;

-- Grant permissions only to tenant-specific role
CREATE ROLE tenant_${tenant_id}_role;
GRANT USAGE ON SCHEMA tenant_${tenant_id}_sensitive TO tenant_${tenant_id}_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_${tenant_id}_sensitive TO tenant_${tenant_id}_role;
```

---

### API Security

#### API Gateway Security

**Rate Limiting**:
```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => req.ip,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 60 seconds
});

@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      await rateLimiter.consume(request.ip);
      return true;
    } catch (rejRes) {
      throw new ThrottlerException('Too many requests');
    }
  }
}
```

**API Key Management**:
```typescript
// API Key Service
@Injectable()
export class ApiKeyService {
  async generateApiKey(tenantId: string, permissions: string[]): Promise<ApiKey> {
    const key = this.generateSecureKey();
    const hashedKey = await bcrypt.hash(key, 12);
    
    return this.prisma.apiKey.create({
      data: {
        tenantId,
        hashedKey,
        permissions,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    });
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { isActive: true }
    });

    for (const apiKey of apiKeys) {
      if (await bcrypt.compare(key, apiKey.hashedKey)) {
        return apiKey;
      }
    }
    return null;
  }

  private generateSecureKey(): string {
    return randomBytes(32).toString('hex');
  }
}
```

#### Webhook Security

**Webhook Signature Verification**:
```typescript
@Injectable()
export class WebhookService {
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async processWebhook(
    payload: any,
    signature: string,
    tenantId: string
  ): Promise<void> {
    const tenant = await this.tenantService.findById(tenantId);
    
    if (!this.verifyWebhookSignature(
      JSON.stringify(payload),
      signature,
      tenant.webhookSecret
    )) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Process webhook
    await this.handleWebhookEvent(payload, tenantId);
  }
}
```

---

### Infrastructure Security

#### Container Security

**Docker Security Configuration**:
```dockerfile
# Multi-stage build with minimal base image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

# Security hardening
RUN apk add --no-cache dumb-init
USER nextjs

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

**Kubernetes Security Context**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: api
        image: ecommerce-api:latest
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
```

#### Network Security

**Network Policies**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    - podSelector:
        matchLabels:
          app: admin
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

---

### Monitoring & Logging

#### Security Monitoring

**Security Event Logging**:
```typescript
@Injectable()
export class SecurityAuditService {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.prisma.securityLog.create({
      data: {
        tenantId: event.tenantId,
        userId: event.userId,
        eventType: event.type,
        severity: event.severity,
        description: event.description,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        metadata: event.metadata,
        timestamp: new Date(),
      }
    });

    // Send alerts for critical events
    if (event.severity === 'critical') {
      await this.sendSecurityAlert(event);
    }
  }

  async detectAnomalousActivity(tenantId: string): Promise<void> {
    const recentEvents = await this.prisma.securityLog.findMany({
      where: {
        tenantId,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    // Detect patterns
    const failedLogins = recentEvents.filter(e => e.eventType === 'login_failed');
    if (failedLogins.length > 10) {
      await this.triggerSecurityAlert('BRUTE_FORCE_DETECTED', {
        tenantId,
        count: failedLogins.length
      });
    }
  }
}
```

**Real-time Threat Detection**:
```typescript
@Injectable()
export class ThreatDetectionService {
  async analyzeRequest(request: Request): Promise<ThreatAssessment> {
    const indicators = await this.collectIndicators(request);
    const riskScore = this.calculateRiskScore(indicators);
    
    if (riskScore > 0.8) {
      await this.blockRequest(request);
      return { risk: 'high', blocked: true };
    }

    if (riskScore > 0.6) {
      await this.requireAdditionalAuth(request);
      return { risk: 'medium', additionalAuth: true };
    }

    return { risk: 'low', blocked: false };
  }

  private async collectIndicators(request: Request): Promise<SecurityIndicator[]> {
    return [
      await this.checkIPReputation(request.ip),
      await this.analyzeUserAgent(request.headers['user-agent']),
      await this.checkRequestPattern(request),
      await this.validateSession(request),
    ];
  }
}
```

---

### Compliance & Auditing

#### GDPR Compliance

**Data Subject Rights Implementation**:
```typescript
@Injectable()
export class GdprService {
  async exportUserData(userId: string, tenantId: string): Promise<UserDataExport> {
    const userData = await this.collectUserData(userId, tenantId);
    
    return {
      personalData: userData.personal,
      orderHistory: userData.orders,
      browsingHistory: userData.browsing,
      marketingConsent: userData.consents,
      exportDate: new Date(),
      format: 'JSON'
    };
  }

  async deleteUserData(userId: string, tenantId: string): Promise<void> {
    // Soft delete with audit trail
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { 
          deletedAt: new Date(),
          email: `deleted_${userId}@deleted.com`,
          firstName: 'DELETED',
          lastName: 'DELETED'
        }
      });

      // Log deletion for audit
      await tx.auditLog.create({
        data: {
          userId,
          tenantId,
          action: 'DATA_DELETION',
          timestamp: new Date(),
          metadata: { reason: 'GDPR_RIGHT_TO_BE_FORGOTTEN' }
        }
      });
    });
  }

  async anonymizeUserData(userId: string, tenantId: string): Promise<void> {
    // Replace PII with pseudonyms
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: `User_${userId.substring(0, 8)}`,
        lastName: `Anonymous_${userId.substring(0, 8)}`,
        phone: null,
        address: null
      }
    });
  }
}
```

#### PCI-DSS Compliance

**Payment Card Security**:
```typescript
@Injectable()
export class PaymentSecurityService {
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    // Never store card details
    const tokenizedData = await this.tokenizeCard(paymentData.cardDetails);
    
    try {
      const result = await this.paymentGateway.process({
        token: tokenizedData.token,
        amount: paymentData.amount,
        currency: paymentData.currency,
        tenantId: paymentData.tenantId
      });

      // Log payment attempt without card details
      await this.auditService.logPayment({
        tenantId: paymentData.tenantId,
        amount: paymentData.amount,
        status: result.status,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      await this.auditService.logPaymentFailure({
        tenantId: paymentData.tenantId,
        amount: paymentData.amount,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  private async tokenizeCard(cardDetails: CardDetails): Promise<CardToken> {
    // Use tokenization service (PCI-DSS compliant)
    return this.tokenizer.tokenize(cardDetails);
  }
}
```

---

### Security Testing

#### Penetration Testing

**Security Test Suite**:
```typescript
describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousInput = "admin' OR '1'='1";
      
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: maliciousInput,
          password: 'password'
        });

      expect(response.status).toBe(401);
    });

    it('should enforce rate limiting', async () => {
      const promises = Array(101).fill(null).map(() =>
        request(app).post('/auth/login').send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Protection', () => {
    it('should encrypt sensitive data at rest', async () => {
      const user = await userService.create({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      });

      // Check that phone is encrypted in database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      expect(dbUser.phone).not.toBe('+1234567890');
      expect(dbUser.phone).toMatch(/^[a-f0-9]+$/); // Hex encrypted
    });
  });
});
```

#### Vulnerability Scanning

**Automated Security Scanning**:
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run npm audit
      run: npm audit --audit-level moderate
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

### Incident Response

#### Security Incident Response Plan

**Incident Classification**:
```typescript
enum IncidentSeverity {
  CRITICAL = 'critical',  // Data breach, system compromise
  HIGH = 'high',          // Suspicious activity, failed attacks
  MEDIUM = 'medium',      // Policy violations, minor issues
  LOW = 'low'            // Informational events
}

interface SecurityIncident {
  id: string;
  severity: IncidentSeverity;
  type: string;
  description: string;
  affectedSystems: string[];
  timeline: IncidentTimeline[];
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  assignedTo?: string;
}

@Injectable()
export class IncidentResponseService {
  async createIncident(incident: CreateIncidentDto): Promise<SecurityIncident> {
    const created = await this.prisma.securityIncident.create({
      data: {
        ...incident,
        status: 'open',
        createdAt: new Date(),
        id: generateIncidentId()
      }
    });

    // Auto-assign based on severity
    await this.autoAssignIncident(created);
    
    // Notify stakeholders
    await this.notifyStakeholders(created);
    
    return created;
  }

  async handleCriticalIncident(incidentId: string): Promise<void> {
    const incident = await this.prisma.securityIncident.findUnique({
      where: { id: incidentId }
    });

    if (incident.severity === IncidentSeverity.CRITICAL) {
      // Immediate containment actions
      await this.executeContainment(incident);
      
      // Activate incident response team
      await this.activateResponseTeam(incident);
      
      // Begin forensic analysis
      await this.beginForensics(incident);
    }
  }
}
```

---

### Approval

**Security Architect**: ___________________  
**Date**: ___________________  
**Signature**: ___________________

**CISO**: ___________________  
**Date**: ___________________  
**Signature**: ___________________

**Compliance Officer**: ___________________  
**Date**: ___________________  
**Signature**: ___________________
