# Chiến lược Giám sát & Cảnh báo
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ DevOps  
**Trạng thái**: Bản nháp  

---

### Triết lý Giám sát

#### Nguyên tắc Cốt lõi

1. **Giám sát Chủ động**: Phát hiện vấn đề trước khi ảnh hưởng người dùng
2. **Hiển thị Full Stack**: Giám sát từ infrastructure đến lớp ứng dụng
3. **Nhận thức Multi-tenant**: Theo dõi hiệu suất theo tenant và toàn cục
4. **Chỉ số Kinh doanh**: Giám sát các KPI quan trọng với kinh doanh
5. **Phản hồi Tự động**: Tự động khắc phục khi có thể

#### Mục tiêu Giám sát

- **99.9% Uptime**: Đảm bảo tính sẵn sàng cao
- **<2s Tải trang**: Duy trì tiêu chuẩn hiệu suất
- **<500ms Phản hồi API**: Đáp ứng mục tiêu hiệu suất API
- **Phát hiện Thời gian thực**: Xác định vấn đề trong vài giây
- **Liên tục Kinh doanh**: Hỗ trợ hoạt động 24/7

---

### Kiến trúc Giám sát

#### Công nghệ Stack

| Thành phần | Công nghệ | Mục đích |
|------------|-----------|---------|
| **Thu thập Chỉ số** | Prometheus | Thu thập chỉ số chuỗi thời gian |
| **Trực quan hóa** | Grafana | Dashboard và trực quan hóa |
| **Logging** | ELK Stack (Elasticsearch, Logstash, Kibana) | Logging tập trung |
| **APM** | Sentry | Giám sát hiệu suất ứng dụng |
| **Infrastructure** | Datadog/New Relic | Giám sát infrastructure |
| **Cảnh báo** | Alertmanager | Định tuyến và quản lý cảnh báo |
| **Uptime** | Pingdom/UptimeRobot | Giám sát uptime bên ngoài |

#### Sơ đồ Kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                             │
├─────────────────────────────────────────────────────────────────┤
│  Applications (API, Web, Admin)                                 │
│    ├─ Metrics Exporter (prometheus-client)                      │
│    ├─ Structured Logging (Winston)                             │
│    ├─ Error Tracking (Sentry)                                 │
│    └─ Custom Business Metrics                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Data Collection Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Prometheus  │  │ Logstash    │  │ Sentry      │              │
│  │ Collection  │  │ Processing  │  │ APM         │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Storage & Analysis                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Prometheus  │  │ Elasticsearch│  │ Sentry      │              │
│  │ TSDB        │  │ Logs        │  │ Events      │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                    Visualization & Alerting                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Grafana     │  │ Kibana      │  │ Alertmanager│              │
│  │ Dashboards  │  │ Log Analysis│  │ Routing     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

### Application Metrics

#### Core Application Metrics

**HTTP Metrics**:
```typescript
// Prometheus metrics collection
import { register, Counter, Histogram, Gauge } from 'prom-client';

// HTTP request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'tenant_id']
});

// HTTP request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'tenant_id'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Active connections gauge
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Middleware to collect metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
      tenant_id: req['tenantId'] || 'unknown'
    };
    
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });
  
  next();
}
```

**Business Metrics**:
```typescript
// Business-specific metrics
const ordersTotal = new Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['tenant_id', 'status']
});

const revenueTotal = new Counter({
  name: 'revenue_total',
  help: 'Total revenue in USD',
  labelNames: ['tenant_id', 'currency']
});

const cartAbandonmentRate = new Gauge({
  name: 'cart_abandonment_rate',
  help: 'Cart abandonment rate percentage',
  labelNames: ['tenant_id']
});

const conversionRate = new Gauge({
  name: 'conversion_rate',
  help: 'Conversion rate percentage',
  labelNames: ['tenant_id']
});

// Service to track business metrics
@Injectable()
export class BusinessMetricsService {
  constructor(
    @Inject('PROMETHEUS_REGISTRY') private registry: Registry
  ) {}

  trackOrderCreated(order: Order) {
    ordersTotal.inc({
      tenant_id: order.tenantId,
      status: order.status
    });

    revenueTotal.inc({
      tenant_id: order.tenantId,
      currency: order.currency
    }, order.total);
  }

  updateConversionRate(tenantId: string, rate: number) {
    conversionRate.set({ tenant_id: tenantId }, rate);
  }

  updateCartAbandonmentRate(tenantId: string, rate: number) {
    cartAbandonmentRate.set({ tenant_id: tenantId }, rate);
  }
}
```

#### Database Metrics

**PostgreSQL Metrics**:
```sql
-- Database performance metrics
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables;

-- Connection metrics
SELECT 
  state,
  count(*) as connections
FROM pg_stat_activity 
GROUP BY state;

-- Query performance metrics
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

**Database Exporter Configuration**:
```yaml
# postgres_exporter config
datasource:
  uri: "postgresql://postgres:password@localhost:5432/ecommerce"
  
queries:
  - name: "tenant_metrics"
    query: |
      SELECT 
        tenant_id,
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        AVG(total) as avg_order_value
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY tenant_id
    metrics:
      - tenant_id:
          usage: "LABEL"
          description: "Tenant identifier"
      - total_orders:
          usage: "GAUGE"
          description: "Total orders in last 24h"
      - total_revenue:
          usage: "GAUGE"
          description: "Total revenue in last 24h"
      - avg_order_value:
          usage: "GAUGE"
          description: "Average order value"
```

---

### Infrastructure Monitoring

#### System Metrics

**Node Exporter Metrics**:
```yaml
# Prometheus configuration for system metrics
scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    metrics_path: /metrics
    scrape_interval: 15s
    
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
    scrape_interval: 30s
    
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']
    scrape_interval: 15s
```

**Key System Metrics**:
- **CPU Usage**: `node_cpu_seconds_total`
- **Memory Usage**: `node_memory_MemAvailable_bytes`
- **Disk Usage**: `node_filesystem_avail_bytes`
- **Network I/O**: `node_network_receive_bytes_total`
- **Disk I/O**: `node_disk_io_time_seconds_total`

#### Container Monitoring

**Docker Metrics**:
```yaml
# cAdvisor configuration for container metrics
cadvisor:
  image: gcr.io/cadvisor/cadvisor:latest
  ports:
    - "8080:8080"
  volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:ro
    - /sys:/sys:ro
    - /var/lib/docker/:/var/lib/docker:ro
    - /dev/disk/:/dev/disk:ro
  privileged: true
  devices:
    - /dev/kmsg
```

**Kubernetes Metrics**:
```yaml
# kube-state-metrics configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kube-state-metrics
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kube-state-metrics
  template:
    metadata:
      labels:
        app: kube-state-metrics
    spec:
      containers:
      - name: kube-state-metrics
        image: quay.io/coreos/kube-state-metrics:v1.9.0
        ports:
        - containerPort: 8080
```

---

### Logging Strategy

#### Structured Logging

**Logger Configuration**:
```typescript
// Winston logger configuration
import winston from 'winston';
import 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, tenantId, userId, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      tenantId,
      userId,
      ...meta
    });
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'ecommerce-api',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport with rotation
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // Error log file
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});

// ELK Stack transport for production
if (process.env.NODE_ENV === 'production') {
  const { ElasticsearchTransport } = require('winston-elasticsearch');
  
  logger.add(new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL
    },
    index: 'ecommerce-logs'
  }));
}
```

**Request Logging Middleware**:
```typescript
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Add request ID to request
  req['requestId'] = requestId;
  res.setHeader('x-request-id', requestId);
  
  // Log request
  logger.info('HTTP Request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    tenantId: req['tenantId'],
    userId: req['user']?.id
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Response', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      tenantId: req['tenantId'],
      userId: req['user']?.id
    });
  });
  
  next();
}
```

#### Log Aggregation

**Logstash Configuration**:
```ruby
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  # Parse JSON logs
  json {
    source => "message"
  }
  
  # Add environment info
  mutate {
    add_field => { "[@metadata][environment]" => "production" }
  }
  
  # Tenant-based indexing
  if [tenantId] {
    mutate {
      add_field => { "[@metadata][index_prefix]" => "tenant-%{tenantId}" }
    }
  } else {
    mutate {
      add_field => { "[@metadata][index_prefix]" => "system" }
    }
  }
  
  # Parse timestamps
  date {
    match => [ "timestamp", "ISO8601" ]
  }
  
  # Extract error details
  if [level] == "error" {
    mutate {
      add_tag => [ "error" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_prefix]}-logs-%{+YYYY.MM.dd}"
    template_name => "ecommerce-logs"
    template => "/etc/logstash/templates/ecommerce-logs.json"
  }
}
```

---

### Alerting Strategy

#### Alert Rules

**Prometheus Alert Rules**:
```yaml
# alert_rules.yml
groups:
  - name: ecommerce.rules
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
          
      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"
          
      # Database connections high
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"
          
      # Memory usage high
      - alert: MemoryUsageHigh
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
          
      # Disk space low
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Disk space is {{ $value | humanizePercentage }} available"
          
      # Tenant-specific alerts
      - alert: TenantOrderRateLow
        expr: rate(orders_total{tenant_id=~".+"}[1h]) < 0.1
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Low order rate for tenant {{ $labels.tenant_id }}"
          description: "Order rate is {{ $value }} orders per hour"
```

**Alertmanager Configuration**:
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@ecommerce-platform.com'
  smtp_auth_username: 'alerts@ecommerce-platform.com'
  smtp_auth_password: 'your-app-password'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: true
    - match:
        severity: warning
      receiver: 'warning-alerts'
    - match:
        alertname: 'TenantOrderRateLow'
      receiver: 'business-alerts'

receivers:
  - name: 'default'
    email_configs:
      - to: 'devops@ecommerce-platform.com'
        subject: '[Ecommerce Alert] {{ .GroupLabels.alertname }}'
        
  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@ecommerce-platform.com'
        subject: '[CRITICAL] Ecommerce Alert: {{ .GroupLabels.alertname }}'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts-critical'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
        
  - name: 'warning-alerts'
    email_configs:
      - to: 'devops@ecommerce-platform.com'
        subject: '[WARNING] Ecommerce Alert: {{ .GroupLabels.alertname }}'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts-warning'
        
  - name: 'business-alerts'
    email_configs:
      - to: 'business-team@ecommerce-platform.com'
        subject: '[BUSINESS] Alert: {{ .GroupLabels.alertname }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
```

---

### Dashboard Design

#### Grafana Dashboards

**System Overview Dashboard**:
```json
{
  "dashboard": {
    "title": "E-commerce System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "active_connections",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ]
  }
}
```

**Business Metrics Dashboard**:
```json
{
  "dashboard": {
    "title": "Business Metrics",
    "panels": [
      {
        "title": "Orders per Hour",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(orders_total[1h]) * 3600",
            "legendFormat": "{{tenant_id}}"
          }
        ]
      },
      {
        "title": "Revenue per Day",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(revenue_total[1d])",
            "legendFormat": "{{tenant_id}}"
          }
        ]
      },
      {
        "title": "Conversion Rate",
        "type": "table",
        "targets": [
          {
            "expr": "conversion_rate",
            "legendFormat": "{{tenant_id}}"
          }
        ]
      },
      {
        "title": "Cart Abandonment Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "cart_abandonment_rate",
            "legendFormat": "{{tenant_id}}"
          }
        ]
      }
    ]
  }
}
```

**Tenant-Specific Dashboard**:
```json
{
  "dashboard": {
    "title": "Tenant Overview - {{tenant_id}}",
    "templating": {
      "list": [
        {
          "name": "tenant_id",
          "type": "query",
          "query": "label_values(orders_total, tenant_id)"
        }
      ]
    },
    "panels": [
      {
        "title": "Tenant Order Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(orders_total{tenant_id=\"$tenant_id\"}[1h]) * 3600"
          }
        ]
      },
      {
        "title": "Tenant Revenue",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(revenue_total{tenant_id=\"$tenant_id\"}[1d])"
          }
        ]
      }
    ]
  }
}
```

---

### Performance Monitoring

#### Application Performance Monitoring (APM)

**Sentry Configuration**:
```typescript
import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Integrations.Http({ tracing: true }),
    new Integrations.Express({ app }),
    new Integrations.Postgres(),
  ],
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
});

// Performance monitoring
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Error tracking
app.use(Sentry.Handlers.errorHandler());

// Custom performance monitoring
export function trackPerformance(operation: string, fn: Function) {
  return Sentry.startSpan(
    {
      op: operation,
      name: operation,
    },
    () => fn()
  );
}
```

**Custom Performance Metrics**:
```typescript
@Injectable()
export class PerformanceService {
  async trackDatabaseQuery(query: string, duration: number) {
    // Track slow queries
    if (duration > 1000) {
      logger.warn('Slow database query detected', {
        query,
        duration,
        threshold: 1000
      });
      
      Sentry.addBreadcrumb({
        message: 'Slow database query',
        level: 'warning',
        data: { query, duration }
      });
    }
  }

  async trackAPIPerformance(endpoint: string, duration: number) {
    // Track API performance
    if (duration > 2000) {
      logger.warn('Slow API endpoint', {
        endpoint,
        duration,
        threshold: 2000
      });
    }
    
    // Send metrics to Prometheus
    httpRequestDuration.observe(
      { method: 'GET', route: endpoint },
      duration / 1000
    );
  }
}
```

---

### Health Checks

#### Health Check Endpoints

**Basic Health Check**:
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly elasticsearchService: ElasticsearchService
  ) {}

  @Get()
  async getHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkElasticsearch(),
      this.checkMemory(),
      this.checkDisk()
    ]);

    const status = checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy';
    
    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error', error: checks[0].reason },
        redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error', error: checks[1].reason },
        elasticsearch: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error', error: checks[2].reason },
        memory: checks[3].status === 'fulfilled' ? checks[3].value : { status: 'error', error: checks[3].reason },
        disk: checks[4].status === 'fulfilled' ? checks[4].value : { status: 'error', error: checks[4].reason }
      }
    };
  }

  private async checkDatabase() {
    const start = Date.now();
    await this.databaseService.query('SELECT 1');
    return {
      status: 'healthy',
      latency: Date.now() - start
    };
  }

  private async checkRedis() {
    const start = Date.now();
    await this.redisService.ping();
    return {
      status: 'healthy',
      latency: Date.now() - start
    };
  }

  private async checkElasticsearch() {
    const start = Date.now();
    await this.elasticsearchService.ping();
    return {
      status: 'healthy',
      latency: Date.now() - start
    };
  }

  private async checkMemory() {
    const usage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    return {
      status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
      usage: {
        heap: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        system: memoryUsagePercent
      }
    };
  }

  private async checkDisk() {
    const stats = await fs.promises.statfs('.');
    const freeSpace = stats.bavail * stats.bsize;
    const totalSpace = stats.blocks * stats.bsize;
    const diskUsagePercent = ((totalSpace - freeSpace) / totalSpace) * 100;
    
    return {
      status: diskUsagePercent < 90 ? 'healthy' : 'warning',
      usage: {
        free: freeSpace,
        total: totalSpace,
        percent: diskUsagePercent
      }
    };
  }
}
```

**Kubernetes Health Probes**:
```yaml
# Kubernetes deployment with health probes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: ecommerce-api:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health/startup
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
```

---

### Incident Response Integration

#### Automated Alert Response

**Alert Response Scripts**:
```bash
#!/bin/bash
# auto-restart.sh - Auto-restart service on critical alerts

SERVICE_NAME=$1
ALERT_SEVERITY=$2

if [ "$ALERT_SEVERITY" = "critical" ]; then
  echo "Critical alert detected for $SERVICE_NAME, restarting service..."
  
  # Restart service
  kubectl rollout restart deployment/$SERVICE_NAME
  
  # Wait for rollout
  kubectl rollout status deployment/$SERVICE_NAME --timeout=300s
  
  # Send notification
  curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
    -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 Auto-restarted $SERVICE_NAME due to critical alert\"}"
fi
```

**Alertmanager Webhook Configuration**:
```yaml
# alertmanager.yml webhook configuration
receivers:
  - name: 'auto-response'
    webhook_configs:
      - url: 'http://auto-response-service:8080/webhook'
        send_resolved: true
        http_config:
          basic_auth:
            username: 'webhook-user'
            password: 'webhook-password'
```

---

### Monitoring Best Practices

#### Performance Optimization

1. **Metrics Collection**:
   - Use efficient metric collection libraries
   - Implement metric sampling for high-frequency data
   - Cache expensive metric calculations

2. **Log Management**:
   - Implement log sampling for verbose applications
   - Use structured logging for better parsing
   - Set appropriate log retention policies

3. **Alert Tuning**:
   - Avoid alert fatigue with proper thresholds
   - Use alert grouping to reduce noise
   - Implement escalation policies

#### Security Considerations

1. **Secure Metrics**:
   - Don't log sensitive information
   - Use authentication for metrics endpoints
   - Encrypt metrics in transit

2. **Access Control**:
   - Role-based access to dashboards
   - Audit access to monitoring systems
   - Secure webhook endpoints

---

### Approval

**DevOps Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________

**SRE Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________

**Tech Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________
