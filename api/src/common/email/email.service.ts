import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  /**
   * =====================================================================
   * EMAIL SERVICE - Dịch vụ gửi Email
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. MOCK SERVICE:
   * - Hiện tại Service này chỉ LOG ra console thay vì gửi email thật.
   * - Lý do: Để dev/test nhanh mà không cần config SMTP server thật.
   *
   * 2. ABSTRACTION:
   * - Mặc dù chỉ là log, nhưng ta vẫn thiết kế nó như một Service chuẩn.
   * - Sau này khi muốn gửi thật (qua SendGrid, Amazon SES...), chỉ cần sửa code ở đây mà không ảnh hưởng code gọi nó.
   * =====================================================================
   */
  private readonly logger = new Logger(EmailService.name);

  sendOrderConfirmation(order: any) {
    this.logger.log(
      `[MOCK EMAIL] Sending Order Confirmation to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Order #${order.id} Confirmed`);
    this.logger.log(
      `Body: Thank you for your purchase! Total: ${order.totalAmount}`,
    );
  }

  sendShippingUpdate(order: any) {
    this.logger.log(
      `[MOCK EMAIL] Sending Shipping Update to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Order #${order.id} Shipped`);
    this.logger.log(`Body: Your order is on the way!`);
  }

  sendInvoice(order: any) {
    this.logger.log(
      `[MOCK EMAIL] Sending Invoice to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Invoice for Order #${order.id}`);
  }

  sendCustomEmail(to: string, subject: string, body: string) {
    this.logger.log(`[MOCK EMAIL] Sending Custom Email to ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Body: ${body}`);
  }
}
