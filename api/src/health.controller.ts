import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

/**
 * =====================================================================
 * HEALTH CONTROLLER - Kiểm tra sức khỏe hệ thống
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. LIVENESS VS READINESS:
 * - `Liveness` (API `/health`): Kiểm tra xem ứng dụng có còn "sống" hay không. Nếu chết, hệ thống quản lý (như Kubernetes) sẽ khởi động lại nó.
 * - `Readiness` (API `/health/ready`): Kiểm tra xem ứng dụng đã sẵn sàng phục vụ chưa (đã kết nối được DB, Redis chưa). Nếu chưa, nó sẽ không nhận request từ người dùng.
 *
 * 2. SYSTEM MONITORING (Giám sát):
 * - API `/health/info` cung cấp các thông số kỹ thuật như mức chiếm dụng RAM (`memory`), thời gian đã chạy (`uptime`).
 * - Giúp đội ngũ vận hành (DevOps) theo dõi tình trạng "sức khỏe" của server theo thời gian thực.
 *
 * 3. DATABASE & REDIS PING:
 * - Ta thực hiện các câu lệnh đơn giản (`SELECT 1`, `ping`) để xác nhận kết nối tới các dịch vụ bên thứ ba vẫn đang hoạt động tốt.
 * =====================================================================
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
