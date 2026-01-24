# Vận hành & Bảo trì
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Vận hành  
**Trạng thái**: Bản nháp  

---

### Triết lý Vận hành

#### Nguyên tắc Vận hành

1. **Proactive Monitoring**: Phát hiện vấn đề trước khi ảnh hưởng người dùng
2. **Automated Response**: Tự động khắc phục khi có thể
3. **Continuous Improvement**: Liên tục cải thiện processes
4. **Documentation First**: Mọi thứ đều được document
5. **Security Focus**: Bảo mật là ưu tiên hàng đầu

#### Mục tiêu Vận hành

- **Uptime**: 99.9% availability target
- **Response Time**: <1 hour cho critical incidents
- **Resolution Time**: <4 hours cho major issues
- **Customer Satisfaction**: 90%+ satisfaction rating
- **Cost Efficiency**: Tối ưu chi phí vận hànhverhead
- **Scalability**: Support business growth without service degradation

#### Service Level Agreements (SLAs)

| Service | Availability | Response Time | Resolution Time |
|---------|--------------|---------------|------------------|
| **API Services** | 99.9% | <5 min | <2 hours |
| **Web Application** | 99.9% | <5 min | <2 hours |
| **Database** | 99.95% | <2 min | <1 hour |
| **Payment Processing** | 99.99% | <1 min | <30 min |
| **Email Services** | 99.5% | <15 min | <4 hours |

---

### Monitoring and Alerting

#### Monitoring Stack

**Infrastructure Monitoring**:
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and management
- **Node Exporter**: System metrics

**Application Monitoring**:
- **Sentry**: Error tracking and performance monitoring
- **New Relic**: Application performance monitoring (APM)
- **LogDNA**: Log aggregation and analysis

**Business Metrics**:
- **Custom Dashboard**: Business KPIs and metrics
- **Revenue Tracking**: Order values and transaction success
- **User Analytics**: Active users and conversion rates

#### Key Metrics Dashboard

**Infrastructure Metrics**:
```yaml
# grafana/dashboards/infrastructure.yml
dashboard:
  title: Infrastructure Overview
  panels:
    - title: CPU Usage
      type: graph
      targets:
        - expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
    
    - title: Memory Usage
      type: graph
      targets:
        - expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
    
    - title: Disk Usage
      type: graph
      targets:
        - expr: (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
    
    - title: Network Traffic
      type: graph
      targets:
        - expr: irate(node_network_receive_bytes_total[5m])
        - expr: irate(node_network_transmit_bytes_total[5m])
```

**Application Metrics**:
```yaml
# grafana/dashboards/application.yml
dashboard:
  title: Application Performance
  panels:
    - title: Request Rate
      type: graph
      targets:
        - expr: rate(http_requests_total[5m])
    
    - title: Response Time
      type: graph
      targets:
        - expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
    
    - title: Error Rate
      type: graph
      targets:
        - expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])
    
    - title: Database Connections
      type: graph
      targets:
        - expr: database_connections_active
```

**Business Metrics**:
```yaml
# grafana/dashboards/business.yml
dashboard:
  title: Business Metrics
  panels:
    - title: Orders per Minute
      type: graph
      targets:
        - expr: rate(orders_total[1m])
    
    - title: Revenue per Hour
      type: graph
      targets:
        - expr: increase(revenue_total[1h])
    
    - title: Active Users
      type: graph
      targets:
        - expr: active_users_total
    
    - title: Conversion Rate
      type: singlestat
      targets:
        - expr: (rate(orders_total[1h]) / rate(page_views_total[1h])) * 100
```

#### Alerting Rules

**Critical Alerts**:
```yaml
# prometheus/rules/critical.yml
groups:
  - name: critical
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          description: "Service {{ $labels.instance }} has been down for more than 1 minute."
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes."
      
      - alert: DatabaseConnectionFailure
        expr: database_connections_active == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "No active database connections detected."
```

**Warning Alerts**:
```yaml
# prometheus/rules/warning.yml
groups:
  - name: warning
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% for the last 5 minutes."
      
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}% for the last 5 minutes."
      
      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries detected"
          description: "95th percentile query time is {{ $value }}s."
```

#### Alert Routing

**Alertmanager Configuration**:
```yaml
# alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@ecommerce.com'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: true
    
    - match:
        severity: warning
      receiver: 'warning-alerts'
      continue: true

receivers:
  - name: 'default'
    email_configs:
      - to: 'ops-team@ecommerce.com'
        subject: '[Ecommerce] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
  
  - name: 'critical-alerts'
    email_configs:
      - to: 'ops-team@ecommerce.com'
        subject: '[CRITICAL] Ecommerce Alert'
        body: |
          CRITICAL ALERT:
          {{ range .Alerts }}
          {{ .Annotations.summary }}
          {{ .Annotations.description }}
          {{ end }}
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts-critical'
        title: 'Critical Alert'
        text: |
          {{ range .Alerts }}
          {{ .Annotations.summary }}
          {{ .Annotations.description }}
          {{ end }}
  
  - name: 'warning-alerts'
    email_configs:
      - to: 'ops-team@ecommerce.com'
        subject: '[WARNING] Ecommerce Alert'
        body: |
          Warning Alert:
          {{ range .Alerts }}
          {{ .Annotations.summary }}
          {{ .Annotations.description }}
          {{ end }}
```

---

### Incident Response

#### Incident Response Process

**Incident Lifecycle**:
1. **Detection**: Automated monitoring or user report
2. **Triage**: Initial assessment and classification
3. **Response**: Investigation and resolution
4. **Recovery**: Service restoration
5. **Post-Mortem**: Analysis and improvement

#### Incident Classification

**Severity Levels**:

| Severity | Definition | Response Time | Resolution Time |
|----------|------------|---------------|------------------|
| **P0 - Critical** | Service completely down, revenue impact | <5 min | <1 hour |
| **P1 - High** | Major functionality broken, user impact | <15 min | <4 hours |
| **P2 - Medium** | Partial functionality degraded | <1 hour | <8 hours |
| **P3 - Low** | Minor issues, no user impact | <4 hours | <24 hours |

#### Incident Response Team

**On-Call Rotation**:
- **Primary On-Call**: First responder, 24/7 availability
- **Secondary On-Call**: Backup and escalation support
- **Engineering Lead**: Technical escalation for complex issues
- **Product Manager**: Business impact assessment
- **Communications**: Customer and stakeholder communications

#### Incident Response Playbooks

**Service Outage Playbook**:
```markdown
# Service Outage Response

## Detection
- Automated alert from monitoring system
- User reports via support channels
- Internal team reports

## Initial Response (First 5 minutes)
1. Acknowledge alert in incident management system
2. Join incident response channel
3. Assess impact and severity
4. Update status page if needed

## Investigation (5-30 minutes)
1. Check monitoring dashboards
2. Review recent deployments
3. Check error logs
4. Verify external dependencies

## Resolution (30-60 minutes)
1. Implement fix or workaround
2. Monitor service recovery
3. Verify functionality
4. Update status page

## Post-Incident (After recovery)
1. Document incident timeline
2. Schedule post-mortem
3. Create improvement tickets
4. Update monitoring/alerts
```

**Database Performance Issue Playbook**:
```markdown
# Database Performance Issue Response

## Detection
- Slow query alerts
- High database CPU usage
- Connection pool exhaustion
- Application timeouts

## Immediate Actions
1. Check database connection status
2. Review slow query log
3. Monitor active connections
4. Check for long-running transactions

## Investigation Steps
1. Identify problematic queries:
   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. Check blocking transactions:
   ```sql
   SELECT blocked_locks.pid AS blocked_pid,
          blocked_activity.usename AS blocked_user,
          blocking_locks.pid AS blocking_pid,
          blocking_activity.usename AS blocking_user,
          blocked_activity.query AS blocked_statement,
          blocking_activity.query AS current_statement_in_blocking_process
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;
   ```

## Resolution Options
1. Kill problematic queries if safe
2. Restart application to clear connections
3. Scale database resources
4. Optimize problematic queries

## Prevention
1. Add query performance monitoring
2. Implement connection pooling limits
3. Regular query optimization
4. Database performance tuning
```

#### Incident Communication

**Communication Channels**:
- **Internal**: Slack #incidents channel
- **External**: Status page (status.ecommerce.com)
- **Customer**: Email notifications for P0/P1 incidents
- **Management**: Executive summary for P0 incidents

**Communication Templates**:

**Initial Incident Notification**:
```
🚨 INCIDENT DECLARED 🚨

Service: [Service Name]
Severity: [P0/P1/P2/P3]
Start Time: [Timestamp]
Impact: [Description of impact]
Current Status: [Investigation in progress]

Next Update: [Time]
Status Page: https://status.ecommerce.com
```

**Resolution Notification**:
```
✅ INCIDENT RESOLVED ✅

Service: [Service Name]
Severity: [P0/P1/P2/P3]
Duration: [Duration]
Root Cause: [Brief description]
Resolution: [Brief description]
Impact: [Final impact assessment]

Post-Mortem: Scheduled for [Date/Time]
```

---

### Backup and Recovery

#### Backup Strategy

**Data Classification**:
- **Critical Data**: Orders, payments, user data, inventory
- **Important Data**: Products, categories, configurations
- **Archival Data**: Historical data, logs, analytics

**Backup Schedule**:
- **Database**: Every 6 hours (real-time replication)
- **Files**: Daily (incremental), Weekly (full)
- **Configuration**: On change
- **Logs**: Daily, retained for 90 days

#### Backup Implementation

**Database Backup**:
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
S3_BUCKET="${AWS_S3_BUCKET:-ecommerce-backups}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Create compressed backup
echo "Creating database backup..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="${BACKUP_FILE}"

# Verify backup integrity
echo "Verifying backup integrity..."
pg_restore --list "${BACKUP_FILE}" > /dev/null
if [ $? -ne 0 ]; then
  echo "Backup verification failed!"
  exit 1
fi

# Upload to S3
echo "Uploading backup to S3..."
aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/database-backups/" \
  --storage-class GLACIER_IR

# Clean local backups (keep last 7 days)
find "${BACKUP_DIR}" -name "ecommerce_backup_*.sql" -mtime +7 -delete

# Update backup metadata
echo "Backup completed: ${BACKUP_FILE}"
echo "Size: $(du -h ${BACKUP_FILE} | cut -f1)"
echo "Uploaded to: s3://${S3_BUCKET}/database-backups/$(basename ${BACKUP_FILE})"
```

**File Backup**:
```bash
#!/bin/bash
# scripts/backup-files.sh

set -e

# Configuration
SOURCE_DIR="/var/www/uploads"
BACKUP_DIR="/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/files_backup_${DATE}.tar.gz"
S3_BUCKET="${AWS_S3_BUCKET:-ecommerce-backups}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Create compressed backup
echo "Creating file backup..."
tar -czf "${BACKUP_FILE}" -C "${SOURCE_DIR}" .

# Upload to S3
echo "Uploading file backup to S3..."
aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/file-backups/" \
  --storage-class STANDARD_IA

# Clean local backups (keep last 30 days)
find "${BACKUP_DIR}" -name "files_backup_*.tar.gz" -mtime +30 -delete

echo "File backup completed: ${BACKUP_FILE}"
```

#### Recovery Procedures

**Database Recovery**:
```bash
#!/bin/bash
# scripts/restore-database.sh

set -e

# Configuration
BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ecommerce}"
DB_USER="${DB_USER:-postgres}"
S3_BUCKET="${AWS_S3_BUCKET:-ecommerce-backups}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  echo "Available backups:"
  aws s3 ls "s3://${S3_BUCKET}/database-backups/" | tail -10
  exit 1
fi

# Download backup from S3
echo "Downloading backup from S3..."
aws s3 cp "s3://${S3_BUCKET}/database-backups/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}"

# Verify backup
echo "Verifying backup integrity..."
pg_restore --list "/tmp/${BACKUP_FILE}" > /dev/null
if [ $? -ne 0 ]; then
  echo "Backup verification failed!"
  exit 1
fi

# Drop existing database
echo "Dropping existing database..."
dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" || true

# Create new database
echo "Creating new database..."
createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"

# Restore database
echo "Restoring database..."
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" \
  --verbose --clean --if-exists --dbname "${DB_NAME}" \
  "/tmp/${BACKUP_FILE}"

# Clean up
rm "/tmp/${BACKUP_FILE}"

echo "Database restore completed successfully!"
```

**Disaster Recovery Plan**:
```markdown
# Disaster Recovery Plan

## Recovery Time Objective (RTO): 4 hours
## Recovery Point Objective (RPO): 1 hour

### Scenarios and Procedures

#### Scenario 1: Database Corruption
**Detection**: Database errors, data inconsistencies
**Recovery Steps**:
1. Identify corruption point
2. Restore from latest clean backup
3. Apply transaction logs up to corruption point
4. Verify data integrity
5. Update application configuration

**Estimated Time**: 2-3 hours

#### Scenario 2: Complete Data Center Outage
**Detection**: All services down, network unreachable
**Recovery Steps**:
1. Activate disaster recovery environment
2. Restore database from latest backup
3. Deploy application code
4. Update DNS to point to DR environment
5. Verify all services
6. Notify stakeholders

**Estimated Time**: 3-4 hours

#### Scenario 3: Ransomware Attack
**Detection**: Encrypted files, ransom notes
**Recovery Steps**:
1. Isolate affected systems
2. Restore from clean backups
3. Change all credentials
4. Scan for malware
5. Patch vulnerabilities
6. Monitor for suspicious activity

**Estimated Time**: 4-6 hours

### Testing Schedule
- **Monthly**: Backup restoration test
- **Quarterly**: Full disaster recovery drill
- **Annually**: Third-party security audit

### Contact Information
- **On-Call Engineer**: +1-555-0001
- **Security Team**: security@ecommerce.com
- **Legal Team**: legal@ecommerce.com
- **Executive Team**: exec@ecommerce.com
```

---

### System Maintenance

#### Maintenance Windows

**Scheduled Maintenance**:
- **Weekly**: Security patches (Sunday 2-4 AM UTC)
- **Monthly**: Database maintenance (First Sunday 1-5 AM UTC)
- **Quarterly**: Major updates (Last Sunday of quarter)
- **Annually**: Infrastructure refresh (Q4)

**Emergency Maintenance**:
- **Critical Security**: Immediate
- **Critical Bug**: Within 24 hours
- **Performance Issues**: Within 48 hours
- **Feature Updates**: During next maintenance window

#### Maintenance Procedures

**Database Maintenance**:
```sql
-- Weekly database maintenance script

-- 1. Update statistics
ANALYZE;

-- 2. Rebuild indexes (fragmented ones)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size,
  pg_stat_get_dead_tuples(indexrelid) as dead_tuples
FROM pg_stat_user_indexes 
WHERE pg_stat_get_dead_tuples(indexrelid) > 1000;

-- 3. Vacuum analyze
VACUUM ANALYZE;

-- 4. Check for bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
    pg_relation_size(schemaname||'.'||tablename)) as bloat_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY (pg_total_relation_size(schemaname||'.'||tablename) - 
  pg_relation_size(schemaname||'.'||tablename)) DESC;

-- 5. Archive old data
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM user_sessions 
WHERE expires_at < NOW() - INTERVAL '7 days';
```

**Application Maintenance**:
```bash
#!/bin/bash
# scripts/application-maintenance.sh

set -e

echo "Starting application maintenance..."

# 1. Clear application cache
echo "Clearing application cache..."
redis-cli FLUSHALL

# 2. Rotate logs
echo "Rotating logs..."
logrotate -f /etc/logrotate.d/ecommerce

# 3. Update dependencies
echo "Checking for security updates..."
npm audit audit-level high

# 4. Clean temporary files
echo "Cleaning temporary files..."
find /tmp -name "ecommerce_*" -mtime +1 -delete

# 5. Health checks
echo "Performing health checks..."
curl -f http://localhost:8080/health || exit 1
curl -f http://localhost:3000/health || exit 1

# 6. Update monitoring metrics
echo "Updating monitoring metrics..."
curl -X POST http://localhost:9090/metrics/job/maintenance \
  -d "maintenance_completed 1"

echo "Application maintenance completed successfully!"
```

#### Patch Management

**Security Patch Process**:
1. **Assessment**: Evaluate security bulletin
2. **Testing**: Apply patch in staging environment
3. **Scheduling**: Plan maintenance window
4. **Deployment**: Apply patch to production
5. **Verification**: Confirm system functionality
6. **Documentation**: Update patch records

**Patch Management Script**:
```bash
#!/bin/bash
# scripts/security-patch.sh

set -e

PATCH_INFO="$1"
PATCH_TYPE="$2"

if [ -z "$PATCH_INFO" ]; then
  echo "Usage: $0 <patch_info> <patch_type>"
  echo "patch_type: security, bugfix, feature"
  exit 1
fi

echo "Applying patch: $PATCH_INFO"
echo "Patch type: $PATCH_TYPE"

# Create maintenance mode page
echo "Enabling maintenance mode..."
kubectl apply -f k8s/maintenance-mode.yaml

# Wait for existing requests to complete
echo "Waiting for requests to drain..."
sleep 30

# Apply patch
case $PATCH_TYPE in
  "security")
    echo "Applying security patch..."
    npm audit fix --force
    ;;
  "bugfix")
    echo "Applying bug fix..."
    npm install "$PATCH_INFO"
    ;;
  "feature")
    echo "Applying feature update..."
    npm install "$PATCH_INFO"
    ;;
esac

# Restart services
echo "Restarting services..."
kubectl rollout restart deployment/ecommerce-api
kubectl rollout restart deployment/ecommerce-web

# Wait for rollout completion
echo "Waiting for rollout completion..."
kubectl rollout status deployment/ecommerce-api --timeout=300s
kubectl rollout status deployment/ecommerce-web --timeout=300s

# Disable maintenance mode
echo "Disabling maintenance mode..."
kubectl delete -f k8s/maintenance-mode.yaml

# Health check
echo "Performing health check..."
curl -f https://api.ecommerce.com/health || exit 1
curl -f https://ecommerce.com/health || exit 1

echo "Patch applied successfully!"
```

---

### Performance Optimization

#### Performance Monitoring

**Key Performance Indicators (KPIs)**:
- **Response Time**: <500ms (95th percentile)
- **Throughput**: >1000 requests/second
- **Error Rate**: <1%
- **CPU Usage**: <70%
- **Memory Usage**: <80%
- **Database Connections**: <80% of pool

#### Performance Optimization Strategies

**Database Optimization**:
```sql
-- Identify slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time
FROM pg_stat_statements 
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- Optimize frequently used queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, c.name as category_name 
FROM products p 
LEFT JOIN categories c ON p.categoryId = c.id 
WHERE p.tenantId = $1 
  AND p.isActive = true 
ORDER BY p.sortOrder 
LIMIT 20;

-- Create missing indexes
CREATE INDEX CONCURRENTLY idx_products_tenant_active 
ON products (tenantId, isActive) 
WHERE isActive = true;

-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

**Application Optimization**:
```typescript
// Performance monitoring middleware
import { Request, Response, NextFunction } from 'express';

export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Record metrics
    metrics.httpRequestDuration.observe(
      { method: req.method, route: req.route?.path },
      duration / 1000
    );
    
    // Alert on slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration,
        userAgent: req.get('User-Agent'),
      });
    }
  });
  
  next();
}

// Database query optimization
export class OptimizedProductService {
  async getProducts(tenantId: string, options: ProductQueryOptions) {
    // Use prepared statements
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.tenantId = $1
        AND p.isActive = true
        AND ($2::text IS NULL OR p.categoryId = $2)
      ORDER BY p.sortOrder
      LIMIT $3 OFFSET $4
    `;
    
    return this.prisma.$queryRawUnsafe(
      query,
      tenantId,
      options.categoryId || null,
      options.limit || 20,
      options.offset || 0
    );
  }
}
```

**Caching Strategy**:
```typescript
// Redis caching implementation
export class CacheService {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache warming for frequently accessed data
  async warmCache(tenantId: string): Promise<void> {
    // Cache popular products
    const popularProducts = await this.productService.getPopularProducts(tenantId);
    await this.set(`products:popular:${tenantId}`, popularProducts, 1800);

    // Cache categories
    const categories = await this.categoryService.getCategories(tenantId);
    await this.set(`categories:${tenantId}`, categories, 3600);
  }
}
```

---

### Security Operations

#### Security Monitoring

**Security Monitoring Tools**:
- **WAF**: Web Application Firewall
- **IDS/IPS**: Intrusion Detection/Prevention System
- **SIEM**: Security Information and Event Management
- **Vulnerability Scanner**: Regular security scans

**Security Alert Rules**:
```yaml
# security/security-alerts.yml
alerts:
  - name: Brute Force Attack
    condition: failed_login_attempts > 10 in 5m
    severity: high
    action: block_ip
    
  - name: SQL Injection Attempt
    condition: sql_injection_pattern in request
    severity: critical
    action: block_request
    
  - name: Suspicious API Usage
    condition: api_requests_per_minute > 1000
    severity: medium
    action: rate_limit
    
  - name: Data Access Anomaly
    condition: unusual_data_access_pattern
    severity: high
    action: require_mfa
```

#### Security Operations Procedures

**Incident Response for Security Events**:
```markdown
# Security Incident Response

## Detection
- Automated security alerts
- User reports of suspicious activity
- External notifications (e.g., from security researchers)

## Immediate Actions (First 15 minutes)
1. Isolate affected systems
2. Preserve evidence (logs, memory dumps)
3. Activate security incident response team
4. Assess scope and impact

## Investigation (15-60 minutes)
1. Analyze logs and indicators of compromise
2. Identify affected systems and data
3. Determine attack vector
4. Assess data exposure

## Containment (1-2 hours)
1. Block attacker access
2. Patch vulnerabilities
3. Reset compromised credentials
4. Implement additional monitoring

## Eradication (2-4 hours)
1. Remove malware/backdoors
2. Restore from clean backups
3. Harden systems
4. Update security controls

## Recovery (4-8 hours)
1. Gradually restore services
2. Monitor for re-infection
3. Notify affected parties
4. Document lessons learned
```

**Security Patch Management**:
```bash
#!/bin/bash
# scripts/security-patch-management.sh

set -e

echo "Starting security patch management..."

# 1. Check for security vulnerabilities
echo "Checking for vulnerabilities..."
npm audit --audit-level critical

# 2. Update security dependencies
echo "Updating security dependencies..."
npm audit fix --force

# 3. Scan container images
echo "Scanning container images..."
trivy image ecommerce-api:latest
trivy image ecommerce-web:latest

# 4. Check system security
echo "Checking system security..."
lynis audit system

# 5. Update firewall rules
echo "Updating firewall rules..."
ufw reload

echo "Security patch management completed!"
```

---

### Knowledge Management

#### Documentation Strategy

**Documentation Types**:
- **Runbooks**: Step-by-step procedures for common tasks
- **Architecture Documentation**: System design and components
- **API Documentation**: Service interfaces and contracts
- **Troubleshooting Guides**: Common issues and solutions
- **Knowledge Base**: Lessons learned and best practices

#### Knowledge Base Structure

```markdown
# Knowledge Base Structure

## Operations
### Runbooks
- Deployment Procedures
- Backup and Recovery
- Incident Response
- Performance Tuning
- Security Operations

### Monitoring
- Dashboard Guides
- Alert Configuration
- Metric Definitions
- Troubleshooting Alerts

### Infrastructure
- Server Configuration
- Network Setup
- Database Administration
- Storage Management

## Development
### Code Standards
- Style Guides
- Testing Guidelines
- Security Best Practices
- Performance Guidelines

### Architecture
- System Design
- API Documentation
- Database Schema
- Integration Patterns

## Business
### Processes
- Change Management
- Release Management
- Vendor Management
- Compliance Requirements

### Metrics
- KPI Definitions
- Performance Benchmarks
- Business Metrics
- Success Criteria
```

#### Training and Onboarding

**New Team Member Onboarding**:
1. **Week 1**: System overview and access setup
2. **Week 2**: Monitoring and alerting training
3. **Week 3**: Incident response simulation
4. **Week 4**: Shadow on-call engineer

**Ongoing Training**:
- **Monthly**: Security awareness training
- **Quarterly**: Incident response drills
- **Semi-annually**: System architecture updates
- **Annually**: Compliance and regulatory training

---

### Approval

**Operations Manager**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**SRE Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Security Officer**: ___________________  
**Date**: ___________________  
**Signature**: ___________________
