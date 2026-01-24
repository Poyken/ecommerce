/**
 * =====================================================================
 * SECURITY CONTROLLER - API QUẢN LÝ BẢO MẬT HỆ THỐNG
 * =====================================================================
 *
 * =====================================================================
 */

import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { SecurityService } from './security.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin - Security')
@Controller('admin/security')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('stats')
  @RequirePermissions('super-admin:read')
  @ApiOperation({ summary: 'Lấy thống kê bảo mật (Super Admin)' })
  async getStats() {
    const result = await this.securityService.getSecurityStats();
    return { data: result };
  }

  @Get('lockdown-status')
  @RequirePermissions('super-admin:read')
  @ApiOperation({ summary: 'Kiểm tra trạng thái khóa hệ thống' })
  async getLockdownStatus() {
    const isLockdown = await this.securityService.getLockdownStatus();
    return { data: { isLockdown } };
  }

  @Post('lockdown')
  @RequirePermissions('super-admin:update')
  @ApiOperation({ summary: 'Bật/tắt chế độ khóa hệ thống khẩn cấp' })
  async toggleLockdown(@Req() req: any, @Body() body: { isEnabled: boolean }) {
    const result = await this.securityService.setSystemLockdown(
      body.isEnabled,
      req.user.tenantId,
      req.user.id,
    );
    return { data: result };
  }

  @Get('whitelist')
  @RequirePermissions('super-admin:read')
  @ApiOperation({ summary: 'Lấy danh sách IP whitelist của user' })
  async getWhitelist(@Req() req: any) {
    const result = await this.securityService.getWhitelistedIps(req.user.id);
    return { data: result };
  }

  @Post('whitelist')
  @RequirePermissions('super-admin:update')
  @ApiOperation({ summary: 'Cập nhật danh sách IP whitelist' })
  async updateWhitelist(@Req() req: any, @Body() body: { ips: string[] }) {
    const result = await this.securityService.updateWhitelistedIps(
      req.user.id,
      body.ips,
    );
    return { data: result };
  }

  @Get('my-ip')
  @RequirePermissions('super-admin:read')
  @ApiOperation({ summary: 'Lấy IP hiện tại của user' })
  getMyIp(@Req() req: any) {
    // In a production environment with a proxy, you might need to check x-forwarded-for
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : req.ip || req.connection.remoteAddress;

    return {
      data: { ip: typeof ip === 'string' ? ip.trim() : String(ip || '') },
    };
  }
}
