import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  sendOrderConfirmation(order: any): Promise<void> {
    this.logger.log(
      `[MOCK EMAIL] Sending Order Confirmation to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Order #${order.id} Confirmed`);
    this.logger.log(
      `Body: Thank you for your purchase! Total: ${order.totalAmount}`,
    );
    return Promise.resolve();
  }

  sendShippingUpdate(order: any): Promise<void> {
    this.logger.log(
      `[MOCK EMAIL] Sending Shipping Update to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Order #${order.id} Shipped`);
    this.logger.log(`Body: Your order is on the way!`);
    return Promise.resolve();
  }

  sendInvoice(order: any): Promise<void> {
    this.logger.log(
      `[MOCK EMAIL] Sending Invoice to ${order.user?.email || 'User'}`,
    );
    this.logger.log(`Subject: Invoice for Order #${order.id}`);
    return Promise.resolve();
  }

  sendCustomEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] Sending Custom Email to ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Body: ${body}`);
    return Promise.resolve();
  }
}
