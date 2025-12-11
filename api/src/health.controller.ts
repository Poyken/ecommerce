import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

/**
 * Health Check Controller
 * Cung cấp các endpoints để kiểm tra trạng thái hệ thống.
 * Dùng cho:
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 * - Hệ thống giám sát
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Basic health check - kiểm tra server có chạy không
   * Dùng cho liveness probe
   */
  @Get()
  @ApiOperation({ summary: 'Kiểm tra sức khỏe cơ bản' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Readiness check - kiểm tra tất cả dependencies
   * Dùng cho readiness probe
   */
  @Get('ready')
  @ApiOperation({ summary: 'Kiểm tra sẵn sàng với database và Redis' })
  async ready() {
    const checks = {
      database: false,
      redis: false,
    };

    // Kiểm tra Database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      checks.database = false;
    }

    // Kiểm tra Redis
    try {
      await this.redis.ping();
      checks.redis = true;
    } catch (error) {
      checks.redis = false;
    }

    const isReady = checks.database && checks.redis;

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Thông tin chi tiết hệ thống - cho giám sát
   */
  @Get('info')
  @ApiOperation({ summary: 'Thông tin hệ thống' })
  info() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      memory: {
        heapUsed:
          Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
      uptime: Math.round(process.uptime()) + 's',
    };
  }
}
