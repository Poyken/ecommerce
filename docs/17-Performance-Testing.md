# Kế Hoạch Kiểm Thử Hiệu Suất & Benchmarking
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Performance Testing  
**Trạng thái**: Bản nháp  

---

### Tổng quan về Kiểm thử Hiệu suất

#### Triết lý kiểm thử

1. **Performance First**: Hiệu suất là tính năng quan trọng nhất
2. **User-Centric**: Tập trung vào trải nghiệm người dùng thực
3. **Multi-Tenant Awareness**: Đảm bảo hiệu suất cho tất cả tenants
4. **Continuous Testing**: Kiểm thử liên tục trong suốt vòng đời
5. **Data-Driven**: Quyết định dựa trên dữ liệu đo lường

#### Mục tiêu hiệu suất

| Chỉ số | Mục tiêu | Mô tả |
|--------|---------|-------|
| **Response Time** | <500ms (95th percentile) | Thời gian phản hồi API |
| **Page Load Time** | <2 giây (trung bình) | Tải trang hoàn chỉnh |
| **Throughput** | 1,000 đơn hàng/phút | Khả năng xử lý giao dịch |
| **Concurrent Users** | 10,000 người dùng | Số người dùng đồng thời |
| **Availability** | 99.9% uptime | Thời gian hoạt động |
| **Resource Utilization** | <80% CPU, <70% Memory | Sử dụng tài nguyên |

---

### Chiến lược Kiểm thử Hiệu suất

#### Phân loại kiểm thử

**1. Kiểm thử Tải (Load Testing)**
```bash
# Kịch bản kiểm thử tải cơ bản
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Warm up
    { duration: '5m', target: 100 }, // Stable load
    { duration: '2m', target: 200 }, // Ramp up
    { duration: '5m', target: 200 }, // Stable load
    { duration: '2m', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.1'],    // <10% failed requests
  },
};

export default function() {
  // Kiểm thử trang chủ
  let response = http.get('https://api.ecommerce-platform.com/v1/products');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**2. Kiểm thử Căng thẳng (Stress Testing)**
```bash
# Kịch bản kiểm thử căng thẳng
export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 1000 }, // Stress level
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 500 },  // Recovery
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Relaxed under stress
    http_req_failed: ['rate<0.2'],      // Allow more failures
  },
};
```

**3. Kiểm thử Độ bền (Endurance Testing)**
```bash
# Kiểm thử chạy trong 8 giờ
export let options = {
  stages: [
    { duration: '30m', target: 200 },
    { duration: '7h', target: 200 },
    { duration: '30m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'],
    http_req_failed: ['rate<0.05'],
  },
};
```

#### Kịch bản kiểm thử Business

**1. Kịch bản Mua sắm**
```javascript
// E-commerce user journey
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://api.ecommerce-platform.com/v1';

export function setup() {
  // Tạo test data
  return {
    products: http.get(`${BASE_URL}/products`).json('data'),
    users: generateTestUsers(100),
  };
}

export default function(data) {
  // 1. Browse products
  let browseResponse = http.get(`${BASE_URL}/products`);
  check(browseResponse, {
    'products loaded': (r) => r.status === 200,
    'products count > 0': (r) => r.json('data').length > 0,
  });

  // 2. View product details
  let product = data.products[Math.floor(Math.random() * data.products.length)];
  let detailResponse = http.get(`${BASE_URL}/products/${product.id}`);
  check(detailResponse, {
    'product details loaded': (r) => r.status === 200,
  });

  // 3. Add to cart
  let cartResponse = http.post(`${BASE_URL}/cart/items`, JSON.stringify({
    productId: product.id,
    quantity: 1,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(cartResponse, {
    'item added to cart': (r) => r.status === 201,
  });

  // 4. Checkout
  let checkoutResponse = http.post(`${BASE_URL}/orders`, JSON.stringify({
    items: [{ productId: product.id, quantity: 1 }],
    shippingAddress: generateTestAddress(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(checkoutResponse, {
    'order created': (r) => r.status === 201,
  });

  sleep(1);
}

function generateTestUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      email: `user${i}@test.com`,
      password: 'Test123456!',
    });
  }
  return users;
}

function generateTestAddress() {
  return {
    firstName: 'Test',
    lastName: 'User',
    address1: '123 Test Street',
    city: 'Test City',
    state: 'TC',
    postalCode: '12345',
    country: 'US',
  };
}
```

**2. Kịch bản Admin Operations**
```javascript
// Admin dashboard operations
export default function() {
  // 1. Login admin
  let loginResponse = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@test.com',
    password: 'Admin123456!',
  }));
  
  let token = loginResponse.json('data.tokens.accessToken');
  let headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. View dashboard
  let dashboardResponse = http.get(`${BASE_URL}/admin/dashboard`, { headers });
  check(dashboardResponse, {
    'dashboard loaded': (r) => r.status === 200,
  });

  // 3. Create product
  let productResponse = http.post(`${BASE_URL}/admin/products`, JSON.stringify({
    name: `Test Product ${Date.now()}`,
    price: 99.99,
    description: 'Test product description',
  }), { headers });
  check(productResponse, {
    'product created': (r) => r.status === 201,
  });

  // 4. View orders
  let ordersResponse = http.get(`${BASE_URL}/admin/orders`, { headers });
  check(ordersResponse, {
    'orders loaded': (r) => r.status === 200,
  });

  sleep(2);
}
```

---

### Kiểm thử Database Hiệu suất

#### Database Benchmarking

**1. PostgreSQL Performance Tests**
```sql
-- Benchmark database queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, c.name as category_name 
FROM products p 
JOIN categories c ON p.categoryId = c.id 
WHERE p.status = 'active' 
AND p.price BETWEEN 10 AND 1000 
ORDER BY p.createdAt DESC 
LIMIT 20;

-- Test concurrent connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Monitor slow queries
SELECT query, calls, total_time, mean_time, rows 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

**2. Connection Pool Testing**
```javascript
// Database connection pool test
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ecommerce',
  user: 'postgres',
  password: 'password',
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default async function() {
  const startTime = Date.now();
  
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as total_orders,
             SUM(total) as revenue,
             AVG(total) as avg_order_value
      FROM orders 
      WHERE createdAt >= NOW() - INTERVAL '24 hours'
    `);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    check(duration, {
      'query time < 100ms': (d) => d < 100,
    });
    
  } catch (error) {
    console.error('Database query failed:', error);
  }
}
```

#### Multi-Tenant Performance

**1. Tenant Isolation Testing**
```javascript
// Test tenant isolation performance
export default function() {
  const tenants = ['tenant1', 'tenant2', 'tenant3', 'tenant4', 'tenant5'];
  const tenant = tenants[Math.floor(Math.random() * tenants.length)];
  
  let response = http.get(`${BASE_URL}/products`, {
    headers: { 'X-Tenant-ID': tenant },
  });
  
  check(response, {
    'tenant isolation works': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
    'correct tenant data': (r) => {
      // Verify data belongs to correct tenant
      return true; // Implement tenant validation logic
    },
  });
}
```

**2. Cross-Tenant Performance Impact**
```javascript
// Test performance impact of multiple tenants
export let options = {
  scenarios: {
    tenant1: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      exec: 'tenantOperations',
      env: { TENANT_ID: 'tenant1' },
    },
    tenant2: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      exec: 'tenantOperations',
      env: { TENANT_ID: 'tenant2' },
    },
    tenant3: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      exec: 'tenantOperations',
      env: { TENANT_ID: 'tenant3' },
    },
  },
};

export function tenantOperations() {
  let response = http.get(`${BASE_URL}/products`, {
    headers: { 'X-Tenant-ID': __ENV.TENANT_ID },
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

### Frontend Performance Testing

#### Web Performance Metrics

**1. Core Web Vitals Testing**
```javascript
// Lighthouse CI configuration
module.exports = {
  ci: {
    collect: {
      url: ['https://ecommerce-platform.com'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**2. Page Load Performance**
```javascript
// Page load time measurement
export default function() {
  let response = http.get('https://ecommerce-platform.com', {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  
  check(response, {
    'homepage loads': (r) => r.status === 200,
    'load time < 2s': (r) => r.timings.duration < 2000,
    'time to first byte < 500ms': (r) => r.timings.waiting < 500,
    'content size < 1MB': (r) => r.body.length < 1024 * 1024,
  });
}
```

#### Mobile Performance Testing

**1. Mobile Device Simulation**
```javascript
// Mobile performance test
export default function() {
  let response = http.get('https://ecommerce-platform.com', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  
  check(response, {
    'mobile site loads': (r) => r.status === 200,
    'mobile load time < 3s': (r) => r.timings.duration < 3000,
    'mobile optimized': (r) => r.html().includes('viewport'),
  });
}
```

---

### API Performance Testing

#### Endpoint Performance

**1. API Response Time Testing**
```javascript
// API endpoint performance
const endpoints = [
  { path: '/products', method: 'GET', expected: 300 },
  { path: '/products/123', method: 'GET', expected: 200 },
  { path: '/cart', method: 'GET', expected: 400 },
  { path: '/cart/items', method: 'POST', expected: 500 },
  { path: '/orders', method: 'POST', expected: 1000 },
];

export default function() {
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  let response;
  if (endpoint.method === 'GET') {
    response = http.get(`${BASE_URL}${endpoint.path}`);
  } else {
    response = http.post(`${BASE_URL}${endpoint.path}`, JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  check(response, {
    [`endpoint ${endpoint.path} responds`]: (r) => r.status < 400,
    [`response time < ${endpoint.expected}ms`]: (r) => r.timings.duration < endpoint.expected,
  });
}
```

**2. Concurrent API Testing**
```javascript
// Concurrent API requests
export let options = {
  vus: 100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  // Simulate concurrent API calls
  let responses = http.batch([
    ['GET', `${BASE_URL}/products`],
    ['GET', `${BASE_URL}/categories`],
    ['GET', `${BASE_URL}/cart`],
  ]);
  
  responses.forEach((response, index) => {
    check(response, {
      [`batch request ${index} successful`]: (r) => r.status === 200,
    });
  });
}
```

---

### Infrastructure Performance Testing

#### Load Balancer Testing

**1. Load Distribution**
```bash
#!/bin/bash
# Test load balancer distribution

ENDPOINTS=(
  "https://api1.ecommerce-platform.com"
  "https://api2.ecommerce-platform.com"
  "https://api3.ecommerce-platform.com"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing $endpoint"
  
  for i in {1..100}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint/health")
    echo "Request $i: $response"
  done
done
```

**2. Failover Testing**
```bash
#!/bin/bash
# Test load balancer failover

echo "Starting failover test..."

# Take down one instance
kubectl scale deployment api-backend --replicas=2

# Test if remaining instances handle load
for i in {1..50}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "https://api.ecommerce-platform.com/health")
  if [ $response -eq 200 ]; then
    echo "Request $i: OK"
  else
    echo "Request $i: FAILED"
  fi
done

# Restore instances
kubectl scale deployment api-backend --replicas=3
```

#### Database Performance

**1. Read/Write Performance**
```sql
-- Read performance test
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.name, p.price, c.name as category
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
WHERE p.status = 'active'
ORDER BY p.createdAt DESC
LIMIT 50;

-- Write performance test
INSERT INTO orders (id, tenantId, customerId, status, total, currency, createdAt, updatedAt)
SELECT 
  gen_random_uuid(),
  'tenant-' || (floor(random() * 100) + 1),
  'user-' || (floor(random() * 1000) + 1),
  'pending',
  random() * 1000,
  'USD',
  NOW(),
  NOW()
FROM generate_series(1, 1000);
```

**2. Connection Pool Testing**
```javascript
// Database connection pool stress test
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ecommerce',
  user: 'postgres',
  password: 'password',
  max: 50,
  idleTimeoutMillis: 30000,
});

export default function() {
  const promises = [];
  
  // Create 20 concurrent queries
  for (let i = 0; i < 20; i++) {
    promises.push(
      pool.query('SELECT COUNT(*) FROM orders WHERE createdAt >= NOW() - INTERVAL \'1 hour\'')
    );
  }
  
  // Wait for all queries to complete
  Promise.all(promises)
    .then(results => {
      check(results.length, {
        'all queries completed': (len) => len === 20,
      });
    })
    .catch(error => {
      console.error('Query failed:', error);
    });
}
```

---

### Monitoring & Reporting

#### Performance Metrics Collection

**1. Real-time Monitoring**
```typescript
// Performance monitoring service
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Metrics definitions
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const activeConnections = new Gauge({
  name: 'active_database_connections',
  help: 'Number of active database connections'
});

const queryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Middleware to collect metrics
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
      tenant_id: req['tenantId'] || 'unknown'
    }, duration);
  });
  
  next();
}
```

**2. Performance Dashboard**
```json
{
  "dashboard": {
    "title": "Performance Metrics",
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
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m]) / rate(http_requests_total[5m])"
          }
        ]
      }
    ]
  }
}
```

#### Test Reporting

**1. Automated Reports**
```python
#!/usr/bin/env python3
# Performance test report generator

import json
import subprocess
import datetime
import smtplib
from email.mime.text import MimeText

def generate_performance_report():
    """Generate comprehensive performance test report"""
    
    # Run k6 tests
    result = subprocess.run([
        'k6', 'run', '--out', 'json=results.json', 'performance-test.js'
    ], capture_output=True, text=True)
    
    # Parse results
    with open('results.json', 'r') as f:
        test_results = json.load(f)
    
    # Calculate metrics
    metrics = calculate_metrics(test_results)
    
    # Generate report
    report = f"""
# Performance Test Report

**Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Test Duration**: {metrics['duration']} seconds
**Total Requests**: {metrics['total_requests']}
**Success Rate**: {metrics['success_rate']}%
**Average Response Time**: {metrics['avg_response_time']}ms
**95th Percentile**: {metrics['p95_response_time']}ms
**Throughput**: {metrics['throughput']} requests/second

## Performance Summary
- Response Time: {'✅ PASS' if metrics['p95_response_time'] < 500 else '❌ FAIL'}
- Success Rate: {'✅ PASS' if metrics['success_rate'] > 95 else '❌ FAIL'}
- Throughput: {'✅ PASS' if metrics['throughput'] > 100 else '❌ FAIL'}

## Recommendations
{generate_recommendations(metrics)}
    """
    
    # Save report
    with open('performance-report.md', 'w') as f:
        f.write(report)
    
    # Send email notification
    send_report_email(report)
    
    return report

def calculate_metrics(results):
    """Calculate performance metrics from test results"""
    
    total_requests = len(results)
    successful_requests = sum(1 for r in results if r['type'] == 'http' and r['status'] == 200)
    response_times = [r['duration'] for r in results if r['type'] == 'http']
    
    return {
        'duration': max(r['timestamp'] for r in results) - min(r['timestamp'] for r in results),
        'total_requests': total_requests,
        'successful_requests': successful_requests,
        'success_rate': (successful_requests / total_requests) * 100,
        'avg_response_time': sum(response_times) / len(response_times),
        'p95_response_time': sorted(response_times)[int(len(response_times) * 0.95)],
        'throughput': total_requests / (max(r['timestamp'] for r in results) - min(r['timestamp'] for r in results))
    }

def generate_recommendations(metrics):
    """Generate performance recommendations"""
    
    recommendations = []
    
    if metrics['p95_response_time'] > 500:
        recommendations.append("- Consider optimizing database queries")
        recommendations.append("- Implement caching strategies")
    
    if metrics['success_rate'] < 95:
        recommendations.append("- Investigate failed requests")
        recommendations.append("- Improve error handling")
    
    if metrics['throughput'] < 100:
        recommendations.append("- Scale horizontally")
        recommendations.append("- Optimize application code")
    
    return '\n'.join(recommendations) if recommendations else "- Performance metrics are within acceptable ranges"

def send_report_email(report):
    """Send performance report via email"""
    
    msg = MimeText(report)
    msg['Subject'] = 'Performance Test Report'
    msg['From'] = 'performance@ecommerce-platform.com'
    msg['To'] = 'devops@ecommerce-platform.com'
    
    # Send email (configure SMTP settings)
    # smtp = smtplib.SMTP('smtp.gmail.com', 587)
    # smtp.send_message(msg)
    # smtp.quit()

if __name__ == "__main__":
    generate_performance_report()
```

---

### Performance Optimization

#### Database Optimization

**1. Query Optimization**
```sql
-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_products_tenant_status 
ON products(tenantId, status) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_orders_created_at 
ON orders(createdAt DESC);

CREATE INDEX CONCURRENTLY idx_orders_tenant_created 
ON orders(tenantId, createdAt DESC);

-- Optimize slow queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.*, c.name as category_name
FROM products p
JOIN categories c ON p.categoryId = c.id
WHERE p.tenantId = $1 AND p.status = 'active'
ORDER BY p.createdAt DESC
LIMIT 20;
```

**2. Connection Pool Optimization**
```typescript
// Database connection pool configuration
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Performance settings
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum connections
  idleTimeoutMillis: 30000,   // Idle timeout
  connectionTimeoutMillis: 2000,
  statement_timeout: 10000,
  
  // Multi-tenant optimization
  statement_timeout: 10000,
  query_timeout: 10000,
});

// Connection monitoring
pool.on('connect', () => {
  console.log('New database connection established');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});
```

#### Application Optimization

**1. Caching Strategy**
```typescript
// Redis caching implementation
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // Product caching with tenant isolation
  async getProduct(tenantId: string, productId: string): Promise<Product | null> {
    const key = `product:${tenantId}:${productId}`;
    return this.get(key);
  }

  async setProduct(tenantId: string, product: Product): Promise<void> {
    const key = `product:${tenantId}:${product.id}`;
    await this.set(key, product, 1800); // 30 minutes
  }

  // Invalidate tenant cache
  async invalidateTenantCache(tenantId: string): Promise<void> {
    await this.invalidate(`*:${tenantId}:*`);
  }
}
```

**2. API Response Optimization**
```typescript
// Response compression and optimization
import compression from 'compression';
import helmet from 'helmet';

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Response caching
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  next();
});
```

---

### Continuous Performance Testing

#### CI/CD Integration

**1. GitHub Actions Workflow**
```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ecommerce_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test environment
      run: |
        npm run db:migrate
        npm run db:seed
    
    - name: Install k6
      run: |
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    
    - name: Run performance tests
      run: |
        k6 run --out json=results.json performance-test.js
    
    - name: Analyze results
      run: |
        node analyze-results.js results.json
    
    - name: Upload results
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: results.json
    
    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const results = JSON.parse(fs.readFileSync('results.json', 'utf8'));
          
          // Calculate metrics
          const metrics = calculateMetrics(results);
          
          // Create comment
          const comment = `
          ## Performance Test Results
          
          - **Response Time (95th)**: ${metrics.p95}ms
          - **Success Rate**: ${metrics.successRate}%
          - **Throughput**: ${metrics.throughput} req/s
          - **Total Requests**: ${metrics.totalRequests}
          
          ${metrics.p95 > 500 ? '⚠️ Response time exceeds 500ms threshold' : '✅ Response time within limits'}
          ${metrics.successRate < 95 ? '⚠️ Success rate below 95%' : '✅ Success rate acceptable'}
          `;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

**2. Performance Gates**
```typescript
// Performance gate checks
interface PerformanceGate {
  name: string;
  threshold: number;
  metric: string;
  comparison: 'lt' | 'gt' | 'eq';
}

const performanceGates: PerformanceGate[] = [
  { name: 'Response Time', threshold: 500, metric: 'p95_response_time', comparison: 'lt' },
  { name: 'Success Rate', threshold: 95, metric: 'success_rate', comparison: 'gt' },
  { name: 'Throughput', threshold: 100, metric: 'throughput', comparison: 'gt' },
];

export function checkPerformanceGates(results: TestResults): GateResult {
  const failures: string[] = [];
  
  for (const gate of performanceGates) {
    const value = results[gate.metric];
    const passed = compareValues(value, gate.threshold, gate.comparison);
    
    if (!passed) {
      failures.push(`${gate.name}: ${value} ${gate.comparison} ${gate.threshold}`);
    }
  }
  
  return {
    passed: failures.length === 0,
    failures,
    summary: failures.length === 0 ? 'All performance gates passed' : `${failures.length} performance gates failed`
  };
}

function compareValues(actual: number, threshold: number, comparison: string): boolean {
  switch (comparison) {
    case 'lt': return actual < threshold;
    case 'gt': return actual > threshold;
    case 'eq': return actual === threshold;
    default: return false;
  }
}
```

---

### Approval

**Performance Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________

**DevOps Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________

**Tech Lead**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________
