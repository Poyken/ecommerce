import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendOrderConfirmation(order: any): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: order.user?.email,
      subject: `Xác nhận đơn hàng #${order.id.slice(-8)}`,
      html: `
        <h1>Cảm ơn bạn đã mua hàng!</h1>
        <p>Đơn hàng <strong>#${order.id.slice(-8)}</strong> đã được xác nhận.</p>
        <p>Tổng tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</p>
        <p>Chúng tôi sẽ sớm giao hàng cho bạn.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Order confirmation email sent to ${order.user?.email}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email`, error);
    }
  }

  async sendOrderStatusUpdate(order: any): Promise<void> {
    const statusMap: Record<string, string> = {
      PROCESSING: 'Đang xử lý',
      SHIPPED: 'Đang giao hàng',
      DELIVERED: 'Giao hàng thành công',
      CANCELLED: 'Đã hủy',
    };

    const statusText = statusMap[order.status] || order.status;
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: order.user?.email,
      subject: `Cập nhật trạng thái đơn hàng #${order.id.slice(-8)}: ${statusText}`,
      html: `
        <h1>Cập nhật trạng thái đơn hàng</h1>
        <p>Chào bạn,</p>
        <p>Đơn hàng <strong>#${order.id.slice(-8)}</strong> của bạn đã chuyển sang trạng thái: <strong>${statusText}</strong>.</p>
        ${order.status === 'SHIPPED' && order.shippingCode ? `<p>Mã vận đơn: <strong>${order.shippingCode}</strong></p>` : ''}
        <p>Xem chi tiết tại: <a href="${this.configService.get('FRONTEND_URL')}/orders/${order.id}">Đơn hàng của tôi</a></p>
        <p>Cảm ơn bạn đã mua sắm tại Poyken Shop!</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Status update email (${order.status}) sent to ${order.user?.email}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send status update email`, error);
    }
  }

  async sendShippingUpdate(order: any): Promise<void> {
    return this.sendOrderStatusUpdate(order);
  }

  sendInvoice(order: any): Promise<void> {
    // Implementation for sending invoice PDF could be added here
    this.logger.log(`Invoice email requested for order ${order.id}`);
    return Promise.resolve();
  }

  async sendCustomEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Custom email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send custom email to ${to}`, error);
    }
  }

  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.sendCustomEmail(
      to,
      'Yêu cầu khôi phục mật khẩu',
      `<p>Bạn nhận được email này vì đã yêu cầu khôi phục mật khẩu cho tài khoản Poyken Shop.</p>
       <p>Vui lòng click vào link sau để đặt lại mật khẩu (link có hiệu lực trong 1 giờ):</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>`,
    );
  }

  async sendPasswordResetSuccess(to: string): Promise<void> {
    await this.sendCustomEmail(
      to,
      'Mật khẩu của bạn đã được thay đổi thành công',
      `<p>Chào bạn,</p>
       <p>Mật khẩu tài khoản Poyken Shop của bạn đã được thay đổi thành công.</p>
       <p>Nếu bạn không thực hiện việc này, vui lòng liên hệ với bộ phận hỗ trợ ngay lập tức.</p>
       <p>Trân trọng,<br/>Poyken Shop Team</p>`,
    );
  }
}
