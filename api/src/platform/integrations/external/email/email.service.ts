import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * =====================================================================
 * EMAIL SERVICE - HỆ THỐNG GỬI EMAIL TỰ ĐỘNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CÔNG CỤ (Nodemailer):
 * - Hệ thống sử dụng thư viện `nodemailer` để kết nối với SMTP Server.
 * - Cấu hình được lấy từ `ConfigService` (biến môi trường .env).
 *
 * 2. TRANSACTIONAL EMAILS:
 * - Đây là loại email gửi dựa trên hành động của user (Xác nhận đơn, Reset pass).
 * - Nội dung được viết dưới dạng HTML template đơn giản để đảm bảo hiển thị tốt trên mọi thiết bị (Outlook, Gmail).
 *
 * 3. ASYNC NOTIFICATION:
 * - Việc gửi email có độ trễ (latency). Thường ta nên gọi qua BullMQ Queue (như trong OrdersService) để tránh treo request của user. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { EmailTemplates } from './email.templates';

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
    const html = EmailTemplates.orderConfirmation(order);
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: order.user?.email,
      subject: `Xác nhận đơn hàng #${order.id.slice(-8)}`,
      html,
    };
    await this.sendMail(mailOptions, `Order confirmation to ${order.user?.email}`);
  }

  async sendOrderStatusUpdate(order: any): Promise<void> {
    const statusMap: Record<string, string> = {
      PROCESSING: 'Đang xử lý',
      SHIPPED: 'Đang giao hàng',
      DELIVERED: 'Giao hàng thành công',
      CANCELLED: 'Đã hủy',
    };
    const statusText = statusMap[order.status] || order.status;
    
    const html = EmailTemplates.orderStatusUpdate(
      order, 
      statusText, 
      this.configService.get('FRONTEND_URL') || ''
    );

    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: order.user?.email,
      subject: `Cập nhật trạng thái đơn hàng #${order.id.slice(-8)}: ${statusText}`,
      html,
    };
    await this.sendMail(mailOptions, `Status update (${order.status}) to ${order.user?.email}`);
  }

  async sendShippingUpdate(order: any): Promise<void> {
    return this.sendOrderStatusUpdate(order);
  }

  sendInvoice(order: any): Promise<void> {
    this.logger.log(`Invoice custom email requested for order ${order.id}`);
    return Promise.resolve();
  }

  async sendCustomEmail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to,
      subject,
      html,
    };
    await this.sendMail(mailOptions, `Custom email to ${to}`);
  }

  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const html = EmailTemplates.passwordReset(resetUrl);

    await this.sendCustomEmail(to, 'Yêu cầu khôi phục mật khẩu', html);
  }

  async sendPasswordResetSuccess(to: string): Promise<void> {
    const html = EmailTemplates.passwordResetSuccess();
    await this.sendCustomEmail(to, 'Mật khẩu của bạn đã được thay đổi thành công', html);
  }

  async sendLoyaltyPointsEarned(to: string, name: string, points: number, orderId: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const html = EmailTemplates.loyaltyPoints(name, points, orderId, frontendUrl || '');
    
    await this.sendCustomEmail(to, `🎉 Bạn đã nhận được ${points} điểm thưởng!`, html);
  }

  // Helper to centralize sendMail error handling
  private async sendMail(options: nodemailer.SendMailOptions, logMsg: string) {
    try {
      await this.transporter.sendMail(options);
      this.logger.log(`✅ ${logMsg}`);
    } catch (error) {
      this.logger.error(`❌ Failed: ${logMsg}`, error);
    }
  }
}
