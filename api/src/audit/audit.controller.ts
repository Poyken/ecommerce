import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * =====================================================================
 * AUDIT CONTROLLER - TRUY XUẤT NHẬT KÝ HỆ THỐNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AUDIT LOG READ (Xem nhật ký):
 * - Đây là API dành riêng cho Admin để kiểm tra xem ai đã làm gì trên hệ thống (VD: Admin nào đã xóa sản phẩm, thời gian nào).
 * - Dữ liệu này cực kỳ quan trọng để truy vết khi có sự cố hoặc tranh chấp.
 *
 * 2. PERMISSIONS (Phân quyền):
 * - Chỉ những user có quyền `auditLog:read` mới được phép gọi API này.
 * - Được bảo vệ bởi `JwtAuthGuard` và `PermissionsGuard`.
 * =====================================================================
 */

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  /**
   * =====================================================================
   * AUDIT CONTROLLER - Nhật ký kiểm toán
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. PURPOSE (Mục đích):
   * - API này giúp Admin xem lại lịch sử các thay đổi dữ liệu trong hệ thống (Ai? Làm gì? Khi nào?).
   * - Rất quan trọng để tra cứu trách nhiệm khi có sự cố.
   *
   * 2. SECURITY:
   * - API này nhạy cảm nên yêu cầu quyền `auditLog:read` và bảo vệ nghiêm ngặt.
   * =====================================================================
   */
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions('auditLog:read')
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.auditService.findAll(+page, +limit, search);
  }
}
