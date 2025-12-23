import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOrderConfirmation(order: any) {
    this.logger.log(
      `[MOCK EMAIL] Sending Order Confirmation to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Order #${order.id} Confirmed`);
    this.logger.log(
      `Body: Thank you for your purchase! Total: ${order.totalAmount}`,
    );
  }

  async sendShippingUpdate(order: any) {
    this.logger.log(
      `[MOCK EMAIL] Sending Shipping Update to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Order #${order.id} Shipped`);
    this.logger.log(`Body: Your order is on the way!`);
  }

  async sendInvoice(order: any) {
    this.logger.log(
      `[MOCK EMAIL] Sending Invoice to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Invoice for Order #${order.id}`);
  }

  async sendCustomEmail(to: string, subject: string, body: string) {
    this.logger.log(`[MOCK EMAIL] Sending Custom Email to ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Body: ${body}`);
  }
}
