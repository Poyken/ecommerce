import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * =====================================================================
 * EMAIL PROCESSOR - Công nhân xử lý gửi Email (Background Worker)
 * =====================================================================
 *
 * =====================================================================
 */

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const { type, email, ...data } = job.data;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (type === 'reset-password') {
      this.logger.log(
        `   → Link reset: ${process.env.FRONTEND_URL}/reset-password?token=${data.token || 'xxx-token-xxx'}`,
      );
    } else if (type === 'welcome-newsletter') {
      this.logger.log(`   → Tên người dùng: ${data.name || 'Khách hàng'}`);
    } else if (type === 'order-confirmation') {
      this.logger.log(`   → Mã đơn hàng: ${data.orderId || 'N/A'}`);
      this.logger.log(`   → Tổng tiền: ${data.total || '0'}đ`);
    } else {
      this.logger.log(
        `📨 [${type?.toUpperCase() || 'UNKNOWN'}] Gửi email thông báo`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log('✅ [EMAIL SENT] Gửi mail thành công!');

    return { success: true, email, type, sentAt: new Date().toISOString() };
  }
}
