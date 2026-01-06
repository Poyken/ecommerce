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
}
