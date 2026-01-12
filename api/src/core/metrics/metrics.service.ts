/**
 * =====================================================================
 * METRICS SERVICE - PROMETHEUS-COMPATIBLE METRICS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Prometheus là hệ thống monitoring phổ biến nhất cho microservices.
 * Service này expose các metrics theo định dạng Prometheus để:
 * - Grafana có thể visualize
 * - Alert Manager có thể gửi cảnh báo
 * - Track performance trends over time
 *
 * Các loại metrics:
 * 1. Counter: Đếm số lần (requests, errors)
 * 2. Gauge: Giá trị hiện tại (active connections, memory)
 * 3. Histogram: Phân bổ giá trị (response times) *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - SRE Dashboard: Cung cấp dữ liệu Sống (Real-time) cho Team Infra biết server có đang quá tải RAM/CPU không.
 * - Business Insights: Đếm số lượng đơn hàng/user mới theo thời gian thực để hiển thị trên màn hình Big Screen của công ty.
 * - Auto-scaling: K8s có thể dựa vào metric `active_requests` để tự động bật thêm server khi traffic tăng đột biến.

 * =====================================================================
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  help: string;
  value: number | Record<string, number>;
  labels?: Record<string, string>;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters: Map<string, number> = new Map();
  private readonly gauges: Map<string, number> = new Map();
  private readonly histograms: Map<string, number[]> = new Map();
  private startTime: number = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.startTime = Date.now();
    this.logger.log('📊 Metrics service initialized');
  }

  // =====================================================================
  // COUNTER METHODS
  // =====================================================================

  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  // =====================================================================
  // GAUGE METHODS
  // =====================================================================

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  // =====================================================================
  // HISTOGRAM METHODS
  // =====================================================================

  recordHistogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    // Keep last 1000 values to prevent memory bloat
    if (values.length > 1000) {
      values.shift();
    }
    this.histograms.set(name, values);
  }

  // =====================================================================
  // BUILT-IN METRICS
  // =====================================================================

  private getSystemMetrics(): Metric[] {
    const mem = process.memoryUsage();
    const uptime = (Date.now() - this.startTime) / 1000;

    return [
      {
        name: 'nodejs_heap_used_bytes',
        type: 'gauge',
        help: 'Process heap memory used in bytes',
        value: mem.heapUsed,
      },
      {
        name: 'nodejs_heap_total_bytes',
        type: 'gauge',
        help: 'Process heap memory total in bytes',
        value: mem.heapTotal,
      },
      {
        name: 'nodejs_rss_bytes',
        type: 'gauge',
        help: 'Process resident set size in bytes',
        value: mem.rss,
      },
      {
        name: 'nodejs_external_bytes',
        type: 'gauge',
        help: 'Node.js external memory in bytes',
        value: mem.external,
      },
      {
        name: 'process_uptime_seconds',
        type: 'gauge',
        help: 'Process uptime in seconds',
        value: uptime,
      },
      {
        name: 'nodejs_active_handles_total',
        type: 'gauge',
        help: 'Number of active handles',
        value: (process as any)._getActiveHandles?.()?.length || 0,
      },
      {
        name: 'nodejs_active_requests_total',
        type: 'gauge',
        help: 'Number of active requests',
        value: (process as any)._getActiveRequests?.()?.length || 0,
      },
    ];
  }

  private async getBusinessMetrics(): Promise<Metric[]> {
    try {
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
        todayOrders,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.product.count({ where: { deletedAt: null } }),
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: 'PENDING' } }),
        this.prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

      return [
        {
          name: 'ecommerce_users_total',
          type: 'gauge',
          help: 'Total number of registered users',
          value: totalUsers,
        },
        {
          name: 'ecommerce_products_total',
          type: 'gauge',
          help: 'Total number of active products',
          value: totalProducts,
        },
        {
          name: 'ecommerce_orders_total',
          type: 'counter',
          help: 'Total number of orders',
          value: totalOrders,
        },
        {
          name: 'ecommerce_orders_pending',
          type: 'gauge',
          help: 'Number of pending orders',
          value: pendingOrders,
        },
        {
          name: 'ecommerce_orders_today',
          type: 'gauge',
          help: 'Number of orders created today',
          value: todayOrders,
        },
      ];
    } catch (error) {
      this.logger.error('Failed to collect business metrics', error);
      return [];
    }
  }

  // =====================================================================
  // PROMETHEUS FORMAT OUTPUT
  // =====================================================================

  async getPrometheusMetrics(): Promise<string> {
    const systemMetrics = this.getSystemMetrics();
    const businessMetrics = await this.getBusinessMetrics();

    // Add custom counters
    const customCounters: Metric[] = Array.from(this.counters.entries()).map(
      ([name, value]) => ({
        name,
        type: 'counter' as const,
        help: `Custom counter: ${name}`,
        value,
      }),
    );

    // Add custom gauges
    const customGauges: Metric[] = Array.from(this.gauges.entries()).map(
      ([name, value]) => ({
        name,
        type: 'gauge' as const,
        help: `Custom gauge: ${name}`,
        value,
      }),
    );

    const allMetrics = [
      ...systemMetrics,
      ...businessMetrics,
      ...customCounters,
      ...customGauges,
    ];

    return this.formatPrometheus(allMetrics);
  }

  private formatPrometheus(metrics: Metric[]): string {
    const lines: string[] = [];

    for (const metric of metrics) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      if (typeof metric.value === 'number') {
        const labels = metric.labels
          ? `{${Object.entries(metric.labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(',')}}`
          : '';
        lines.push(`${metric.name}${labels} ${metric.value}`);
      }
    }

    return lines.join('\n');
  }

  // =====================================================================
  // JSON FORMAT OUTPUT (for internal use)
  // =====================================================================

  async getMetricsJson(): Promise<Record<string, any>> {
    const systemMetrics = this.getSystemMetrics();
    const businessMetrics = await this.getBusinessMetrics();

    return {
      timestamp: new Date().toISOString(),
      system: Object.fromEntries(systemMetrics.map((m) => [m.name, m.value])),
      business: Object.fromEntries(
        businessMetrics.map((m) => [m.name, m.value]),
      ),
      custom: {
        counters: Object.fromEntries(this.counters),
        gauges: Object.fromEntries(this.gauges),
      },
    };
  }
}
