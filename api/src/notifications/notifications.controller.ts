import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { EmailService } from '../common/email/email.service';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { SendToUserDto } from './dto/send-to-user.dto';
import { NotificationsService } from './notifications.service';

/**
 * =====================================================================
 * NOTIFICATIONS CONTROLLER - API endpoints cho thông báo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER ENDPOINTS (Authenticated):
 * - GET / : Lấy danh sách thông báo của user
 * - GET /unread-count : Đếm số thông báo chưa đọc
 * - PATCH /:id/read : Đánh dấu một thông báo đã đọc
 * - PATCH /read-all : Đánh dấu tất cả đã đọc
 * - DELETE /:id : Xóa một thông báo
 * - DELETE /read-all : Xóa tất cả thông báo đã đọc
 *
 * 2. ADMIN ENDPOINTS (Require permissions):
 * - POST /admin/broadcast : Gửi thông báo cho tất cả users
 * - POST /admin/send : Gửi thông báo cho user cụ thể
 * - GET /admin : Xem tất cả thông báo (với filters)
 * - GET /admin/:id : Xem chi tiết thông báo
 * =====================================================================
 */

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  // ========== USER ENDPOINTS ==========

  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  @Get()
  async findAll(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const data = await this.notificationsService.findAll(
      req.user.userId,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
    return { data };
  }

  /**
   * Đếm số thông báo chưa đọc
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const data = await this.notificationsService.getUnreadCount(
      req.user.userId,
    );
    return { data };
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const data = await this.notificationsService.markAllAsRead(req.user.userId);
    return { data };
  }

  /**
   * Đánh dấu một thông báo đã đọc
   */
  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const data = await this.notificationsService.markAsRead(
      id,
      req.user.userId,
    );
    return { data };
  }

  /**
   * Xóa một thông báo
   */
  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const data = await this.notificationsService.delete(id, req.user.userId);
    return { data };
  }

  /**
   * Xóa tất cả thông báo đã đọc
   */
  @Delete('read-all')
  async deleteAllRead(@Request() req) {
    const data = await this.notificationsService.deleteAllRead(req.user.userId);
    return { data };
  }

  // ========== ADMIN ENDPOINTS ==========

  /**
   * Gửi thông báo cho TẤT CẢ users (Broadcast)
   */
  @Post('admin/broadcast')
  @UseGuards(PermissionsGuard)
  @Permissions('notification:create')
  async broadcast(@Body(ValidationPipe) data: BroadcastNotificationDto) {
    const result = await this.notificationsService.broadcast({
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    });

    if (data.sendEmail) {
      // In a real app, this would be a background job
      console.log('Broadcasting email to all users...');
      // TODO: Implement email broadcasting via queue
    }

    return { data: result };
  }

  /**
   * Gửi thông báo cho user cụ thể
   */
  @Post('admin/send')
  @UseGuards(PermissionsGuard)
  @Permissions('notification:create')
  async sendToUser(@Body(ValidationPipe) data: SendToUserDto) {
    const result = await this.notificationsService.create({
      userId: data.userId,
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
  }

  /**
   * Lấy tất cả thông báo (Admin view với filters)
   */
  @Get('admin/all')
  @UseGuards(PermissionsGuard)
  @Permissions('notification:read')
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
  ) {
    const filters: any = {};
    if (userId) filters.userId = userId;
    if (type) filters.type = type;
    if (isRead !== undefined) filters.isRead = isRead === 'true';

    const data = await this.notificationsService.findAllAdmin(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
    return data; // Already has { data, meta }
  }

  /**
   * Lấy chi tiết một thông báo (Admin)
   */
  @Get('admin/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('notification:read')
  async findOne(@Param('id') id: string) {
    const data = await this.notificationsService.findOne(id);
    return { data };
  }

  /**
   * Cleanup: Xóa thông báo đã đọc cũ (Admin)
   */
  @Delete('admin/cleanup')
  @UseGuards(PermissionsGuard)
  @Permissions('notification:delete')
  async cleanupOldNotifications(@Query('daysOld') daysOld?: string) {
    const data = await this.notificationsService.deleteOldReadNotifications(
      daysOld ? parseInt(daysOld) : 30,
    );
    return { data };
  }
}
