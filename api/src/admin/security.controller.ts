/**
 * =====================================================================
 * SECURITY CONTROLLER - API QUẢN LÝ BẢO MẬT HỆ THỐNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Controller này cung cấp các API cho trang Security Dashboard của Super Admin.
 * Tất cả endpoint đều yêu cầu quyền 'superAdmin:read' hoặc 'superAdmin:write'.
 *
 * 1. CÁC ENDPOINT:
 *    - GET /admin/security/stats
 *      -> Thống kê bảo mật: Số lần login 24h, % người dùng bật 2FA
 *
 *    - GET /admin/security/lockdown-status
 *      -> Kiểm tra trạng thái "khóa hệ thống" (System Lockdown)
 *
 *    - POST /admin/security/lockdown
 *      -> Bật/tắt chế độ khóa hệ thống khẩn cấp
 *      -> Body: { isEnabled: true/false }
 *
 *    - GET /admin/security/whitelist
 *      -> Lấy danh sách IP được phép đăng nhập của user hiện tại
 *
 *    - POST /admin/security/whitelist
 *      -> Cập nhật danh sách IP whitelist
 *      -> Body: { ips: ["1.2.3.4", "5.6.7.8"] }
 *
 * 2. GUARDS BẢO VỆ:
 *    - JwtAuthGuard: Kiểm tra access token hợp lệ
 *    - PermissionsGuard + @Permissions(): Kiểm tra quyền superAdmin
 * =====================================================================
 */

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { SecurityService } from './security.service';

@Controller('admin/security')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('stats')
  @Permissions('superAdmin:read')
  async getStats() {
    return this.securityService.getSecurityStats();
  }

  @Get('lockdown-status')
  @Permissions('superAdmin:read')
  async getLockdownStatus() {
    return { isEnabled: await this.securityService.getLockdownStatus() };
  }

  @Post('lockdown')
  @Permissions('superAdmin:write')
  async toggleLockdown(@Body() body: { isEnabled: boolean }) {
    return this.securityService.setSystemLockdown(body.isEnabled);
  }

  @Get('whitelist')
  @Permissions('superAdmin:read')
  async getWhitelist(@Req() req: any) {
    return this.securityService.getWhitelistedIps(req.user.id);
  }

  @Post('whitelist')
  @Permissions('superAdmin:write')
  async updateWhitelist(@Req() req: any, @Body() body: { ips: string[] }) {
    return this.securityService.updateWhitelistedIps(req.user.id, body.ips);
  }

  @Get('my-ip')
  @Permissions('superAdmin:read')
  async getMyIp(@Req() req: any) {
    // In a production environment with a proxy, you might need to check x-forwarded-for
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : req.ip || req.connection.remoteAddress;

    return { ip: typeof ip === 'string' ? ip.trim() : String(ip || '') };
  }
}
