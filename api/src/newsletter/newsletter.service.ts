import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

/**
 * =====================================================================
 * NEWSLETTER SERVICE - Dịch vụ quản lý đăng ký bản tin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ASYNCHRONOUS PROCESSING (Xử lý bất đồng bộ):
 * - Khi có người đăng ký email, ta không gửi email chào mừng ngay lập tức vì việc này có thể làm chậm phản hồi của API.
 * - Thay vào đó, ta đẩy một "Job" vào `emailQueue` (sử dụng BullMQ và Redis).
 *
 * 2. QUEUE BENEFITS:
 * - Giúp hệ thống chịu tải tốt hơn (Scalability).
 * - Nếu server gửi mail bị lỗi, BullMQ có thể tự động thử lại (Retry) sau một khoảng thời gian.
 *
 * 3. LOGGING:
 * - Sử dụng `Logger` của NestJS để ghi lại các sự kiện quan trọng, giúp theo dõi hoạt động của hệ thống trong môi trường Production.
 * =====================================================================
 */

@Injectable()
export class NewsletterService {
  /**
   * =====================================================================
   * NEWSLETTER SERVICE - Dịch vụ quản lý đăng ký bản tin
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. ASYNCHRONOUS PROCESSING (Xử lý bất đồng bộ):
   * - Khi có người đăng ký email, ta không gửi email chào mừng ngay lập tức vì việc này có thể làm chậm phản hồi của API.
   * - Thay vào đó, ta đẩy một "Job" vào `emailQueue` (sử dụng BullMQ và Redis).
   *
   * 2. QUEUE BENEFITS:
   * - Giúp hệ thống chịu tải tốt hơn (Scalability).
   * - Nếu server gửi mail bị lỗi, BullMQ có thể tự động thử lại (Retry) sau một khoảng thời gian.
   *
   * 3. LOGGING:
   * - Sử dụng `Logger` của NestJS để ghi lại các sự kiện quan trọng, giúp theo dõi hoạt động của hệ thống trong môi trường Production.
   * =====================================================================
   */
  private readonly logger = new Logger(NewsletterService.name);

  constructor(@InjectQueue('email-queue') private readonly emailQueue: Queue) {}

  async subscribe(email: string) {
    this.logger.log(`New subscriber: ${email}`);

    // Extract name from email for personalization
    const name = email.split('@')[0];

    // Add job to queue to send welcome email (mock)
    await this.emailQueue.add('send-email', {
      email,
      name,
      type: 'welcome-newsletter',
    });

    return { message: 'Subscribed successfully' };
  }
}
