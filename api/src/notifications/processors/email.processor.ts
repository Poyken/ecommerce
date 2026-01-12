import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * =====================================================================
 * EMAIL PROCESSOR - Công nhân xử lý gửi Email (Background Worker)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BACKGROUND PROCESSING:
 * - Đây là một "Worker" (Công nhân) chạy ngầm. Nó không làm việc trực tiếp với người dùng.
 * - Nó liên tục lắng nghe `email-queue` trong Redis. Khi có "Job" mới, nó sẽ lấy ra và thực hiện.
 *
 * 2. ASYNC BENEFITS:
 * - Giúp API phản hồi ngay lập tức cho người dùng mà không cần chờ đợi mail server phản hồi (thường mất vài giây).
 * - Nếu mail server bị lỗi, Worker này có thể tự động thử lại (Retry) mà người dùng không hề hay biết.
 *
 * 3. JOB DATA:
 * - `job.data` chứa toàn bộ thông tin cần thiết để gửi email: Địa chỉ người nhận, loại email (Reset Password, Order Confirm), và các biến dữ liệu (Token, Order ID).
 *
 * 4. SIMULATION:
 * - Trong code này, ta sử dụng `setTimeout` để mô phỏng độ trễ của việc gửi email thật qua các dịch vụ như AWS SES hay SendGrid. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

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
