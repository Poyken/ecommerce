import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { MetricsService } from '@core/metrics/metrics.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';
import type { Response } from 'express';

/**
 * =====================================================================
 * HEALTH CONTROLLER - GIÁM SÁT SỨC KHỎE HỆ THỐNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. LIVENESS vs READINESS:
 * - API `/health` dùng để biết server có đang sống (`Liveness`) hay không.
 * - API `/health/ready` khắt khe hơn: Phải kết nối được Database, Redis và các Queue (`Readiness`) thì Web mới được coi là sẵn sàng phục vụ.
 *
 * 2. MONITORING (Giám sát):
 * - Hàm `info` trả về các thông số kỹ thuật như: Lượng RAM đang dùng, CPU, Uptime (thời gian server đã chạy liên tục).
 * - Giúp phát hiện sớm các lỗi tràn bộ nhớ (Memory Leak). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, validate dữ liệu và điều phối xử lý logic thông qua các Service tương ứng.

 * =====================================================================
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectQueue('orders-queue') private readonly ordersQueue: Queue,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra sức khỏe cơ bản' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Kiểm tra sẵn sàng với database, Redis và Queues' })
  async ready() {
    const checks: {
      database: boolean;
      redis: boolean;
      queues: { email: boolean; orders: boolean; queuesError?: string };
    } = {
      database: false,
      redis: false,
      queues: {
        email: false,
        orders: false,
      },
    };

    // 1. Database Check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      checks.database = false;
    }

    // 2. Redis Check
    try {
      await this.redis.ping();
      checks.redis = true;
    } catch (error) {
      checks.redis = false;
    }

    // 3. Queues Check (BullMQ)
    try {
      const [emailStatus, orderStatus] = await Promise.all([
        this.emailQueue.client.then((c) => c.ping()),
        this.ordersQueue.client.then((c) => c.ping()),
      ]);
      checks.queues.email = emailStatus === 'PONG';
      checks.queues.orders = orderStatus === 'PONG';
    } catch (error) {
      checks.queues.queuesError = error.message;
    }

    const isReady =
      checks.database &&
      checks.redis &&
      checks.queues.email &&
      checks.queues.orders;

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @Get('info')
  @ApiOperation({ summary: 'Thông tin hệ thống chi tiết' })
  info() {
    const mem = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
        external: Math.round(mem.external / 1024 / 1024) + 'MB',
        heapUsedPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100) + '%',
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000) + 'ms',
        system: Math.round(cpuUsage.system / 1000) + 'ms',
      },
      eventLoop: {
        lag: this.getEventLoopLag() + 'ms',
        status: this.getEventLoopLag() < 100 ? 'healthy' : 'degraded',
      },
      uptime: {
        seconds: Math.round(process.uptime()),
        formatted: this.formatUptime(process.uptime()),
      },
      monitoring: {
        sentry: !!process.env.SENTRY_DSN,
        sentryEnvironment: process.env.SENTRY_DSN
          ? process.env.NODE_ENV
          : 'disabled',
      },
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }

  /**
   * [P18 OPTIMIZATION] Measure Event Loop Lag
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   * Nếu giá trị này cao (> 100ms), nghĩa là Server đang bị quá tải CPU
   * hoặc có logic đồng bộ (Sync) tốn quá nhiều thời gian, làm nghẽn hàng đợi.
   */
  private getEventLoopLag(): number {
    const start = Date.now();
    // Use setImmediate to measure how long it takes for a callback to be executed
    setImmediate(() => {});
    return Date.now() - start;
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus-compatible metrics endpoint' })
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metrics.getPrometheusMetrics();
  }

  @Get('metrics/json')
  @ApiOperation({ summary: 'Metrics in JSON format' })
  async getMetricsJson() {
    return this.metrics.getMetricsJson();
  }

  @Get('debug-db')
  async debugDb() {
    try {
      const order = await this.prisma.order.findFirst();
      return { status: 'ok', order };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        code: error.code,
        meta: error.meta,
      };
    }
  }

  @Get('debug-orders')
  async debugOrders() {
    try {
      const include = {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: {
          include: {
            sku: {
              include: { product: true },
            },
          },
        },
      };
      const orders = await this.prisma.order.findMany({
        take: 1,
        include,
      });
      return { status: 'ok', orders };
    } catch (error) {
      return { status: 'error', message: error.message, stack: error.stack };
    }
  }

  @Get('debug-skus')
  async debugSkus() {
    try {
      const skus = await this.prisma.sku.findMany({
        take: 1,
        include: { product: true },
      });
      return { status: 'ok', skus };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }
}
