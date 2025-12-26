import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { resolveMx } from 'dns/promises';
import { PrismaService } from '@core/prisma/prisma.service';

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
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async subscribe(email: string) {
    this.logger.log(`New subscriber attempt: ${email}`);

    // Check MX Record
    try {
      const domain = email.split('@')[1];
      if (domain) {
        const mxRecords = await resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
          throw new Error('Invalid domain');
        }
      } else {
        throw new Error('Invalid email format');
      }
    } catch {
      throw new ConflictException(
        `Email domain '${email.split('@')[1]}' is invalid or unreachable`,
      );
    }

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Email already subscribed');
      } else {
        // Reactivate
        await this.prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
    } else {
      // Create new
      await this.prisma.newsletterSubscriber.create({
        data: { email },
      });
    }

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

  async checkSubscriber(email: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });
    return {
      exists: !!subscriber,
      isActive: subscriber?.isActive ?? false,
    };
  }
}
