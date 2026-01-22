# Môi trường & Triển khai
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ DevOps  
**Trạng thái**: Bản nháp  

---

### Tổng quan Môi trường

#### Chiến lược Môi trường

1. **Environment Isolation**: Môi trường hoàn toàn tách biệt
2. **Infrastructure as Code**: Quản lý infrastructure qua code
3. **Automated Deployment**: CI/CD pipeline tự động
4. **Zero Downtime**: Triển khai không gián đoạn
5. **Security First**: Bảo mật theo mặc định

#### Môi trường Phát triển

**Local Development**
- Docker Compose cho multi-service setup
- Hot reload cho frontend và backend
- Local PostgreSQL và Redis
- Seed data cho testing

**Development Environment**
- Staging environment gần production
- Real API endpoints
- Shared database cho team
- Automated testing integration

#### Environment Matrix

| Environment | Purpose | Infrastructure | Data | Monitoring |
|-------------|---------|----------------|------|------------|
| **Development** | Local development | Docker Compose | Seed data | Basic logging |
| **Staging** | Pre-production testing | Cloud (Render) | Anonymized prod data copy | Full monitoring |
| **Production** | Live service | Cloud (Render/Vercel) | Real data | Full monitoring + alerts |

---

### Local Development Setup

#### Prerequisites

```bash
# Required software versions
Node.js >= 20.0.0
npm >= 9.0.0
Docker >= 20.0.0
Docker Compose >= 2.0.0
Git >= 2.30.0
```

#### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/ecommerce-platform.git
cd ecommerce-platform

# 2. Copy environment files
cp api/.env.example api/.env
cp web/.env.example web/.env.local

# 3. Start infrastructure services
docker-compose up -d postgres redis elasticsearch

# 4. Install dependencies
cd api && npm install && cd ../web && npm install

# 5. Setup database
cd api && npx prisma generate && npx prisma db push

# 6. Seed development data
cd api && npm run seed

# 7. Start development servers
npm run dev:api    # API server on port 8080
npm run dev:web   # Web server on port 3000
```

#### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:latest
    environment:
      POSTGRES_DB: ecommerce_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./api/prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

#### Environment Variables

```bash
# api/.env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="development"
PORT=8080
JWT_SECRET="your-jwt-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# External Services
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Storage
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="ecommerce-dev-files"

# Search
ELASTICSEARCH_URL="http://localhost:9200"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
```

```bash
# web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
```

---

### Staging Environment

#### Infrastructure Configuration

**Provider**: Render  
**Region**: Oregon (us-west-2)  
**High Availability**: Yes  

#### Services Configuration

| Service | Instance Type | Scaling | Database | Storage |
|---------|---------------|---------|----------|---------|
| **API** | Standard 2X | Auto (1-3) | PostgreSQL 15 | 10GB |
| **Web** | Standard 2X | Auto (1-2) | - | 5GB |
| **Worker** | Standard 1X | Auto (1-2) | - | 2GB |
| **Redis** | Redis 7 | Single | - | 2GB |
| **PostgreSQL** | - | - | PostgreSQL 15 | 100GB |

#### Deployment Pipeline

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd api && npm ci
          cd ../web && npm ci
      
      - name: Run tests
        run: |
          cd api && npm run test
          cd ../web && npm run test
      
      - name: Run E2E tests
        run: |
          cd api && npm run test:e2e

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy API to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_API_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Web to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

#### Staging Configuration

```bash
# Staging environment variables
NODE_ENV="staging"
DATABASE_URL="${RENDER_DATABASE_URL}"
REDIS_URL="${RENDER_REDIS_URL}"

# External services (sandbox mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Monitoring
SENTRY_DSN="https://staging-sentry-dsn"
LOG_LEVEL="debug"

# Feature flags
ENABLE_AI_FEATURES="true"
ENABLE_ADVANCED_ANALYTICS="true"
```

---

### Production Environment

#### Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                           │
│                    (AWS Application Load Balancer)              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼───┐         ┌───▼───┐         ┌───▼───┐
│ API   │         │ API   │         │ API   │
│ Pod 1 │         │ Pod 2 │         │ Pod 3 │
│ (us-east-1a) │    │ (us-east-1b) │    │ (us-east-1c) │
└───┬───┘         └───┬───┘         └───┬───┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Database Cluster                            │
│                   (Amazon RDS PostgreSQL)                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   Primary   │  │  Replica 1  │  │     Replica 2        │   │
│  │ (us-east-1a)│  │ (us-east-1b)│  │   (us-east-1c)     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Cache Layer                                 │
│                   (Amazon ElastiCache Redis)                   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   Node 1   │  │   Node 2    │  │      Node 3         │   │
│  │ (us-east-1a)│  │ (us-east-1b)│  │   (us-east-1c)     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Production Services

| Service | Instance Type | Min/Max Scaling | Database | Storage |
|---------|---------------|-----------------|----------|---------|
| **API** | Standard 4X | 3-10 | PostgreSQL 15 | 500GB SSD |
| **Web** | Standard 2X | 2-5 | - | 50GB |
| **Worker** | Standard 2X | 2-8 | - | 20GB |
| **Redis** | Redis 7 Cluster | 3 nodes | - | 50GB |
| **PostgreSQL** | db.r6g.large | Multi-AZ | - | 1TB SSD |

#### Production Deployment

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: 'security-scan-results.sarif'

  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Load testing
        uses: grafana/k6-action@v0.3.0
        with:
          filename: 'tests/performance/load-test.js'

  deploy-api:
    needs: [security-scan, performance-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy API to Production
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_PROD_API_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-success: true

  deploy-web:
    needs: deploy-api
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Web to Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.PROD_ORG_ID }}
          vercel-project-id: ${{ secrets.PROD_PROJECT_ID }}
          vercel-args: '--prod'
          vercel-prod: true

  health-check:
    needs: [deploy-api, deploy-web]
    runs-on: ubuntu-latest
    steps:
      - name: Health Check
        run: |
          curl -f https://api.ecommerce.com/health || exit 1
          curl -f https://ecommerce.com/health || exit 1
```

---

### Docker Configuration

#### Multi-stage Dockerfile (API)

```dockerfile
# api/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 8080

ENV PORT 8080

CMD ["npm", "start"]
```

#### Multi-stage Dockerfile (Web)

```dockerfile
# web/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

---

### Infrastructure as Code

#### Terraform Configuration

```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "ecommerce-vpc"
    Environment = var.environment
  }
}

# Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "ecommerce-private-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 100}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "ecommerce-public-${count.index + 1}"
    Environment = var.environment
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier = "ecommerce-db"
  
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.r6g.large"
  
  allocated_storage     = 1000
  max_allocated_storage = 2000
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "ecommerce"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "ecommerce-final-snapshot"
  
  tags = {
    Name = "ecommerce-db"
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "ecommerce-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "ecommerce-redis"
  engine               = "redis"
  node_type            = "cache.r6g.large"
  num_cache_nodes      = 3
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  tags = {
    Name = "ecommerce-redis"
    Environment = var.environment
  }
}
```

---

### CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd api && npm ci
          cd ../web && npm ci
      
      - name: Lint
        run: |
          cd api && npm run lint
          cd ../web && npm run lint
      
      - name: Type check
        run: |
          cd api && npm run type-check
          cd ../web && npm run type-check
      
      - name: Unit tests
        run: |
          cd api && npm run test:unit
          cd ../web && npm run test:unit
      
      - name: Integration tests
        run: |
          cd api && npm run test:integration
      
      - name: E2E tests
        run: |
          cd api && npm run test:e2e

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

  build-and-push:
    needs: [lint-and-test, security-scan]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    strategy:
      matrix:
        service: [api, web]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-success: true
```

---

### Monitoring and Logging

#### Application Monitoring

```typescript
// api/src/monitoring/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Business metrics
export const ordersTotal = new Counter({
  name: 'orders_total',
  help: 'Total number of orders created',
  labelNames: ['tenant_id', 'status'],
});

export const revenueTotal = new Gauge({
  name: 'revenue_total',
  help: 'Total revenue',
  labelNames: ['tenant_id', 'currency'],
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  labelNames: ['tenant_id'],
});

// Database metrics
export const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
```

#### Health Checks

```typescript
// api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
      () => this.checkExternalServices(),
    ]);
  }

  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('metrics')
  metrics() {
    return register.metrics();
  }
}
```

#### Logging Configuration

```typescript
// api/src/logging/logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'ecommerce-api',
    version: process.env.APP_VERSION,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
```

---

### Backup and Disaster Recovery

#### Database Backup Strategy

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ecommerce}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ecommerce_backup_${DATE}.sql"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Create backup
echo "Creating database backup..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="${BACKUP_FILE}"

# Verify backup
echo "Verifying backup..."
pg_restore --list "${BACKUP_FILE}" > /dev/null

# Upload to S3
if [ -n "${AWS_S3_BUCKET}" ]; then
  echo "Uploading backup to S3..."
  aws s3 cp "${BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/database-backups/"
fi

# Clean old backups (keep last 30 days)
find "${BACKUP_DIR}" -name "ecommerce_backup_*.sql" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}"
```

#### Disaster Recovery Plan

```yaml
# disaster-recovery-plan.yml
disaster_recovery:
  rto: 4 hours  # Recovery Time Objective
  rpo: 1 hour   # Recovery Point Objective
  
  scenarios:
    - name: "Database Failure"
      severity: "critical"
      steps:
        - "Detect failure via monitoring alerts"
        - "Promote read replica to primary"
        - "Update application configuration"
        - "Verify application functionality"
        - "Notify stakeholders"
      
    - name: "Region Outage"
      severity: "critical"
      steps:
        - "Detect region-wide failure"
        - "Activate disaster recovery environment"
        - "Update DNS to point to DR region"
        - "Verify application functionality"
        - "Notify stakeholders"
      
    - name: "Data Corruption"
      severity: "high"
      steps:
        - "Identify corruption point"
        - "Restore from latest clean backup"
        - "Apply transaction logs up to corruption point"
        - "Verify data integrity"
        - "Notify stakeholders"

  testing:
    frequency: "quarterly"
    scenarios:
      - "Database failover test"
      - "Application recovery test"
      - "Data restoration test"
```

---

### Security Configuration

#### Security Headers

```typescript
// api/src/security/security.middleware.ts
import { MiddlewareConsumer, NestModule } from '@nestjs/common';

export function securityMiddleware(app: NestModule) {
  app.apply(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );
}
```

#### Rate Limiting

```typescript
// api/src/security/rate-limit.config.ts
import { ThrottlerModule } from '@nestjs/throttler';

export const rateLimitConfig = ThrottlerModule.forRoot([
  {
    ttl: 60000,        // 1 minute
    limit: 100,        // 100 requests per minute
  },
  {
    ttl: 60000,        // 1 minute
    limit: 10,         // 10 login attempts per minute
    skipIf: (req) => !req.url.includes('/auth/login'),
  },
]);
```

---

### Environment-Specific Configurations

#### Development Configuration

```typescript
// config/development.config.ts
export const developmentConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    ssl: false,
    logging: true,
  },
  redis: {
    host: 'localhost',
    port: 6379,
    tls: false,
  },
  app: {
    debug: true,
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true,
    },
  },
  monitoring: {
    enabled: false,
    level: 'debug',
  },
};
```

#### Production Configuration

```typescript
// config/production.config.ts
export const productionConfig = {
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: true,
    logging: false,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    tls: true,
  },
  app: {
    debug: false,
    cors: {
      origin: ['https://ecommerce.com'],
      credentials: true,
    },
  },
  monitoring: {
    enabled: true,
    level: 'info',
  },
};
```

---

### Troubleshooting Guide

#### Common Issues

**Database Connection Issues**:
```bash
# Check database connectivity
pg_isready -h localhost -p 5432

# Check connection pool
SELECT * FROM pg_stat_activity WHERE datname = 'ecommerce';

# Reset connection pool
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'ecommerce';
```

**Redis Connection Issues**:
```bash
# Check Redis connectivity
redis-cli ping

# Check Redis memory usage
redis-cli info memory

# Clear Redis cache (careful in production)
redis-cli FLUSHDB
```

**Application Performance Issues**:
```bash
# Check application logs
docker logs ecommerce-api

# Monitor resource usage
docker stats

# Check database queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Debug Commands

```bash
# Health check endpoints
curl https://api.ecommerce.com/health
curl https://api.ecommerce.com/health/ready
curl https://api.ecommerce.com/health/metrics

# Database diagnostics
psql -h localhost -U postgres -d ecommerce -c "\dt"
psql -h localhost -U postgres -d ecommerce -c "SELECT COUNT(*) FROM users"

# Cache diagnostics
redis-cli info keyspace
redis-cli info stats
```

---

### Performance Testing Strategy

#### Load Testing Configuration

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 300 }, // Ramp up to 300 users
    { duration: '5m', target: 300 }, // Stay at 300 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.1'],    // Error rate < 10%
    errors: ['rate<0.1'],
  },
};

export default function () {
  const baseUrl = 'https://api.staging.ecommerce.com';
  
  // Test product listing
  const productsResponse = http.get(`${baseUrl}/products`, {
    headers: { 'Accept': 'application/json' },
  });
  
  const isProductsSuccess = check(productsResponse, {
    'products status is 200': (r) => r.status === 200,
    'products response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!isProductsSuccess);
  
  // Test product search
  const searchResponse = http.get(`${baseUrl}/products/search?q=laptop`, {
    headers: { 'Accept': 'application/json' },
  });
  
  const isSearchSuccess = check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!isSearchSuccess);
  
  sleep(1);
}
```

#### Database Performance Testing

```sql
-- tests/performance/database-performance.sql
-- Test concurrent product queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, c.name as category_name, b.name as brand_name
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
LEFT JOIN brands b ON p.brandId = b.id
WHERE p.tenantId = $1 
  AND p.isActive = true 
  AND p.basePrice BETWEEN $2 AND $3
ORDER BY p.sortOrder, p.name
LIMIT 20;

-- Test order creation performance
EXPLAIN (ANALYZE, BUFFERS)
INSERT INTO orders (tenantId, userId, orderNumber, status, currency, subtotal, taxAmount, shippingAmount, total, shippingAddress, billingAddress)
VALUES ($1, $2, $3, 'pending', 'USD', $4, $5, $6, $7, $8, $9);

-- Test inventory update performance
EXPLAIN (ANALYZE, BUFFERS)
UPDATE inventory_items 
SET quantity = quantity - $1, reserved = reserved + $1
WHERE skuId = $2 AND warehouseId = $3 AND quantity - $1 >= 0;
```

---

### Security Hardening Checklist

#### Application Security

```typescript
// api/src/security/security.config.ts
export const securityConfig = {
  // CSRF Protection
  csrf: {
    cookieHttpOnly: true,
    cookieSecure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
  
  // Input Validation
  validation: {
    sanitizeInput: true,
    maxRequestSize: '10mb',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  
  // Authentication Security
  auth: {
    jwtExpiration: '15m',
    refreshExpiration: '7d',
    maxLoginAttempts: 5,
    lockoutDuration: '15m',
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
  },
  
  // API Security
  api: {
    rateLimiting: {
      general: { requests: 100, windowMs: 60000 },
      auth: { requests: 10, windowMs: 60000 },
      upload: { requests: 5, windowMs: 60000 },
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
    },
  },
};
```

#### Infrastructure Security

```yaml
# infrastructure/security-hardening.yml
security_groups:
  api_sg:
    ingress:
      - protocol: tcp
        port: 443
        cidr_blocks: [0.0.0.0/0]
      - protocol: tcp
        port: 80
        cidr_blocks: [0.0.0.0/0]
    egress:
      - protocol: -1
        cidr_blocks: [0.0.0.0/0]
  
  database_sg:
    ingress:
      - protocol: tcp
        port: 5432
        security_groups: [api_sg]
    egress:
      - protocol: tcp
        port: 443
        cidr_blocks: [0.0.0.0/0]

encryption:
  at_rest:
    database: true
    storage: true
    backups: true
  in_transit:
    tls_version: '1.3'
    cipher_suites: ['TLS_AES_256_GCM_SHA384']

logging:
  audit_logs:
    retention: 90_days
    encryption: true
    access_control: true
```

---

### Compliance and Auditing

#### GDPR Compliance

```typescript
// api/src/compliance/gdpr.service.ts
export class GDPRService {
  // Right to be forgotten
  async anonymizeUser(userId: string): Promise<void> {
    await this.prisma.$transaction([
      // Anonymize personal data
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.com`,
          firstName: 'Deleted',
          lastName: 'User',
          phone: null,
          metadata: {},
        },
      }),
      
      // Delete sensitive data
      this.prisma.auditLog.deleteMany({
        where: { userId },
      }),
      
      // Archive orders for legal requirements
      this.prisma.order.updateMany({
        where: { userId },
        data: {
          billingAddress: {},
          shippingAddress: {},
          notes: null,
        },
      }),
    ]);
  }
  
  // Data export
  async exportUserData(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: true,
        reviews: true,
        cart: true,
      },
    });
    
    return {
      personalData: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
      },
      orders: user.orders.map(order => ({
        id: order.id,
        date: order.orderDate,
        total: order.total,
        status: order.status,
      })),
      reviews: user.reviews.map(review => ({
        rating: review.rating,
        title: review.title,
        date: review.createdAt,
      })),
    };
  }
}
```

#### PCI-DSS Compliance Checklist

```markdown
## PCI-DSS Compliance Requirements

### 1. Network Security
- [ ] Firewall configuration reviewed
- [ ] Secure network architecture implemented
- [ ] Wireless network security
- [ ] Cardholder data environment isolated

### 2. Data Protection
- [ ] Cardholder data encrypted at rest
- [ ] Transmission encryption (TLS 1.3)
- [ ] Strong cryptography and security protocols
- [ ] Sensitive authentication data not stored

### 3. Vulnerability Management
- [ ] Anti-virus software maintained
- [ ] Secure systems and applications developed
- [ ] Vulnerability scanning quarterly
- [ ] Penetration testing annually

### 4. Access Control
- [ ] Business need-to-know principle
- [ ] Unique user identification
- [ ] Physical access to data restricted
- [ ] Remote access authentication

### 5. Monitoring and Testing
- [ ] Tracking and monitoring access
- [ ] Secure logging and log analysis
- [ ] Security incident response plan
- [ ] Regular testing of security systems

### 6. Information Security Policy
- [ ] Information security policy established
- [ ] Information security policy communicated
- [ ] Information security policy maintained
- [ ] Risk assessment process
```

---

### Incident Response Procedures

#### Security Incident Response

```yaml
# incident-response/playbook.yml
security_incident:
  severity_levels:
    critical: "System compromise, data breach"
    high: "Security control failure, suspicious activity"
    medium: "Policy violation, minor security issue"
    low: "Informational security event"
  
  response_team:
    incident_commander: "DevOps Lead"
    security_lead: "Security Engineer"
    communications: "Product Manager"
    technical_lead: "Backend Lead"
  
  procedures:
    detection:
      - "Monitor security alerts"
      - "Review anomaly detection"
      - "Analyze log patterns"
      - "Validate threat intelligence"
    
    containment:
      - "Isolate affected systems"
      - "Block malicious IPs"
      - "Disable compromised accounts"
      - "Preserve evidence"
    
    eradication:
      - "Remove malware"
      - "Patch vulnerabilities"
      - "Update security controls"
      - "Verify system integrity"
    
    recovery:
      - "Restore from clean backups"
      - "Monitor for recurrence"
      - "Update security policies"
      - "Conduct post-incident review"
  
  communication:
    internal:
      - "Immediate notification to response team"
      - "Hourly updates during incident"
      - "Post-incident report within 48 hours"
    
    external:
      - "Customer notification if data affected"
      - "Regulatory reporting if required"
      - "Public statement if significant incident"
```

#### Escalation Matrix

```typescript
// api/src/monitoring/escalation.service.ts
export class EscalationService {
  private escalationLevels = {
    level1: {
      threshold: { responseTime: 30, resolutionTime: 240 },
      contacts: ['oncall-engineer@company.com'],
      actions: ['slack_alert', 'email_notification'],
    },
    level2: {
      threshold: { responseTime: 15, resolutionTime: 120 },
      contacts: ['oncall-engineer@company.com', 'tech-lead@company.com'],
      actions: ['slack_alert', 'email_notification', 'sms_alert'],
    },
    level3: {
      threshold: { responseTime: 5, resolutionTime: 60 },
      contacts: ['oncall-engineer@company.com', 'tech-lead@company.com', 'devops-lead@company.com'],
      actions: ['slack_alert', 'email_notification', 'sms_alert', 'phone_call'],
    },
  };
  
  async escalateIncident(incidentId: string, severity: string): Promise<void> {
    const level = this.determineEscalationLevel(severity);
    const config = this.escalationLevels[level];
    
    // Notify contacts
    for (const contact of config.contacts) {
      await this.notificationService.send({
        to: contact,
        subject: `Incident ${incidentId} - Level ${level} Escalation`,
        message: this.buildEscalationMessage(incidentId, severity),
        actions: config.actions,
      });
    }
    
    // Log escalation
    await this.auditService.log({
      action: 'incident_escalation',
      incidentId,
      level,
      timestamp: new Date(),
    });
  }
}
```

---

### Cost Optimization Strategy

#### Resource Optimization

```yaml
# cost-optimization/strategy.yml
optimization_areas:
  compute:
    - "Right-size instances based on metrics"
    - "Use spot instances for non-critical workloads"
    - "Implement auto-scaling policies"
    - "Schedule non-production resources"
  
  storage:
    - "Implement data lifecycle policies"
    - "Use appropriate storage tiers"
    - "Compress and archive old data"
    - "Optimize database storage"
  
  network:
    - "Use CDN for static assets"
    - "Optimize data transfer"
    - "Implement caching strategies"
    - "Compress API responses"
  
  licensing:
    - "Review software licenses quarterly"
    - "Use open-source alternatives"
    - "Negotiate enterprise agreements"
    - "Eliminate unused licenses"

monthly_reviews:
  - "Resource utilization report"
  - "Cost variance analysis"
  - "Optimization recommendations"
  - "Budget vs actual comparison"

automation:
  - "Cost anomaly detection"
  - "Automated resource tagging"
  - "Scheduled resource shutdown"
  - "Budget alerts and notifications"
```

#### Monitoring Costs

```typescript
// api/src/monitoring/cost-tracker.service.ts
export class CostTrackerService {
  async trackResourceCosts(): Promise<CostReport> {
    const costs = await this.gatherCostData();
    
    return {
      total: costs.total,
      byService: {
        compute: costs.compute,
        database: costs.database,
        storage: costs.storage,
        network: costs.network,
      },
      byEnvironment: {
        development: costs.development,
        staging: costs.staging,
        production: costs.production,
      },
      trends: this.calculateTrends(costs),
      recommendations: this.generateRecommendations(costs),
    };
  }
  
  private generateRecommendations(costs: CostData): string[] {
    const recommendations = [];
    
    if (costs.compute.utilization < 0.5) {
      recommendations.push('Consider right-sizing compute instances');
    }
    
    if (costs.storage.growthRate > 0.2) {
      recommendations.push('Implement data archival policies');
    }
    
    if (costs.network.dataTransfer > 1000) {
      recommendations.push('Optimize data transfer with CDN');
    }
    
    return recommendations;
  }
}
```

---

### Approval

**DevOps Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Security Officer**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Compliance Officer**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Infrastructure Manager**: ___________________  
**Date**: ___________________  
**Signature**: ___________________
