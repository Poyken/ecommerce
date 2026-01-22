import {
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  ApiCreateResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { getTenant } from '@core/tenant/tenant.context';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { SendToUserDto } from './dto/send-to-user.dto';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { NotificationsService } from './notifications.service';

/**
 * =====================================================================
 * NOTIFICATIONS CONTROLLER - API endpoints cho thông báo
 * =====================================================================
 *
 * =====================================================================
 */

@ApiTags('Notifications (Thông báo)')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  // ========== USER ENDPOINTS ==========
  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  @Get()
  @ApiListResponse('Notification')
  @ApiOperation({ summary: 'Lấy danh sách thông báo của user hiện tại' })
  async findAll(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user.id;
    return this.notificationsService.findAll(
      userId,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  /**
   * Đếm số thông báo chưa đọc
   */
  @Get('unread-count')
  @ApiGetOneResponse('Notification Count')
  @ApiOperation({ summary: 'Đếm số thông báo chưa đọc' })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { data: count };
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  @Patch('read-all')
  @ApiUpdateResponse('Notification')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  async markAllAsRead(@Request() req) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return { data: result };
  }

  /**
   * Đánh dấu một thông báo đã đọc
   */
  @Patch(':id/read')
  @ApiUpdateResponse('Notification')
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  async markAsRead(@Request() req, @Param('id') id: string) {
    const result = await this.notificationsService.markAsRead(id, req.user.id);
    return { data: result };
  }

  /**
   * Xóa một thông báo
   */
  @Delete(':id')
  @ApiDeleteResponse('Notification')
  @ApiOperation({ summary: 'Xóa một thông báo' })
  async delete(@Request() req, @Param('id') id: string) {
    const result = await this.notificationsService.delete(id, req.user.id);
    return { data: result };
  }

  /**
   * Xóa tất cả thông báo đã đọc
   */
  @Delete('read-all')
  @ApiDeleteResponse('Notification')
  @ApiOperation({ summary: 'Xóa tất cả thông báo đã đọc' })
  async deleteAllRead(@Request() req) {
    const result = await this.notificationsService.deleteAllRead(req.user.id);
    return { data: result };
  }

  // ========== ADMIN ENDPOINTS ==========

  /**
   * Gửi thông báo cho TẤT CẢ users (Broadcast)
   */
  @Post('admin/broadcast')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('notification:create')
  @ApiCreateResponse('Notification')
  @ApiOperation({ summary: 'Gửi thông báo cho TẤT CẢ users (Broadcast)' })
  async broadcast(@Body() data: BroadcastNotificationDto) {
    const tenant = getTenant();
    const result = await this.notificationsService.broadcast({
      tenantId: tenant!.id,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    });

    if (data.sendEmail) {
      this.logger.log('Broadcasting email to all users...');
      // TODO: Implement email broadcasting via queue
    }

    return { data: result };
  }

  /**
   * Gửi thông báo cho user cụ thể
   */
  @Post('admin/send')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('notification:create')
  @ApiCreateResponse('Notification')
  @ApiOperation({ summary: 'Gửi thông báo cho user cụ thể' })
  async sendToUser(@Body() data: SendToUserDto) {
    try {
      const tenant = getTenant();
      const result = await this.notificationsService.create({
        userId: data.userId,
        tenantId: tenant!.id,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      });

      if (data.sendEmail && data.email) {
        await this.emailService.sendCustomEmail(
          data.email,
          data.title,
          data.message,
        );
      }

      return { data: result };
    } catch (err) {
      this.logger.error('[NotificationsController] sendToUser error:', err);
      throw err;
    }
  }

  /**
   * Lấy tất cả thông báo (Admin view với filters)
   */
  @Get('admin/all')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('notification:read')
  @ApiListResponse('Notification')
  @ApiOperation({ summary: 'Lấy tất cả thông báo (Admin view với filters)' })
  async findAllAdmin(@Query() filters: FilterNotificationDto) {
    const data = await this.notificationsService.findAllAdmin(filters);
    return data;
  }

  /**
   * Lấy chi tiết một thông báo (Admin)
   */
  @Get('admin/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('notification:read')
  @ApiGetOneResponse('Notification')
  @ApiOperation({ summary: 'Lấy chi tiết một thông báo (Admin)' })
  async findOne(@Param('id') id: string) {
    const data = await this.notificationsService.findOne(id);
    return { data };
  }

  /**
   * Cleanup: Xóa thông báo đã đọc cũ (Admin)
   */
  @Delete('admin/cleanup')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('notification:delete')
  @ApiDeleteResponse('Notification')
  @ApiOperation({ summary: 'Cleanup: Xóa thông báo đã đọc cũ (Admin)' })
  async cleanupOldNotifications(@Query('daysOld') daysOld?: string) {
    const data = await this.notificationsService.deleteOldReadNotifications(
      daysOld ? parseInt(daysOld) : 30,
    );
    return { data };
  }
}
