import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';

/**
 * =====================================================================
 * HEALTH CONTROLLER - Kiểm tra sức khỏe hệ thống (P2 Enhanced)
 * =====================================================================
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
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
    const checks: any = {
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
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      platform: process.platform,
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
        external: Math.round(mem.external / 1024 / 1024) + 'MB',
      },
      cpuUsage: process.cpuUsage(),
      uptime: Math.round(process.uptime()) + 's',
    };
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
      const include: any = {
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
