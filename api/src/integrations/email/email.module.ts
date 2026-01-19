import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
/**
 * =====================================================================
 * EMAIL MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WRAPPER SERVICE:
 * - Đây là wrapper quanh thư viện gửi mail (như Nodemailer hoặc SendGrid).
 * - Giúp decouple logic gửi mail ra khỏi business logic chính.
 *
 * 2. EXPORTS:
 * - Các module khác (Auth, Order) chỉ cần import `EmailModule` và gọi `emailService.send(...)`. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
export class EmailModule {}
