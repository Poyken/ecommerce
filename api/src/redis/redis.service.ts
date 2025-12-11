import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService
  extends Redis
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    // Cách dùng URL: Truyền trực tiếp string vào super()
    super(process.env.REDIS_URL || '', {
      // Thêm các option phụ nếu cần cho môi trường Prod
      tls:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false, // Thường cần thiết cho một số cloud provider
            }
          : undefined,
      // Cấu hình chiến lược thử lại (Retry Strategy)
      retryStrategy: (times) => {
        const maxRetry = 10; // Chỉ thử lại tối đa 10 lần

        if (times > maxRetry) {
          // Trả về null để ngừng kết nối hẳn (App sẽ quăng lỗi và có thể crash)
          console.error('Redis: Giving up after 10 retries');
          return null;
        }

        // Thời gian chờ tăng dần: 50ms, 100ms, 150ms... nhưng tối đa là 2 giây
        const delay = Math.min(times * 50, 2000);
        return delay;
      },

      // Tùy chọn: Tắt tính năng tự kết nối lại nếu lỗi ngay từ đầu (lúc khởi động app)
      // enableOfflineQueue: false, // Mặc định là true và bật trên production để app không quay đều
    });

    // Lưu ý: ioredis sẽ tự tách host, port, password từ cái link đó.
  }

  onModuleInit() {
    this.on('connect', () => {
      this.logger.log('Redis đã kết nối thành công');
    });

    this.on('error', (err) => {
      this.logger.error('Kết nối Redis thất bại', err);
    });
  }

  onModuleDestroy() {
    this.disconnect();
  }
}
