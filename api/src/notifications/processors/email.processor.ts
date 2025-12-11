import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(
      `[EmailProcessor] Đang gửi email xác nhận cho Đơn hàng #${job.data.orderId} đến ${job.data.email}...`,
    );

    // Mô phỏng độ trễ gửi email (ví dụ: AWS SES, SendGrid)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(
      `[EmailProcessor] Email đã được gửi thành công đến ${job.data.email}!`,
    );
  }
}
