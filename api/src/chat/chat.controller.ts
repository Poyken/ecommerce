import type { RequestWithUser } from '@/auth/interfaces/request-with-user.interface';
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { ChatService } from './chat.service';

/**
 * =====================================================================
 * CHAT CONTROLLER - QUẢN LÝ LỊCH SỬ HỘI THOẠI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ADMIN VIEW:
 * - Admin cần API `/conversations` để xem danh sách tất cả các khách hàng đang chờ hỗ trợ.
 * - API `/history/:userId` cho phép Admin xem lại toàn bộ tin nhắn cũ với một khách hàng cụ thể.
 *
 * 2. USER VIEW:
 * - API `/my-history` giúp khách hàng load lại tin nhắn của chính họ khi F5 trang web hoặc chuyển đổi thiết bị.
 * =====================================================================
 */
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * ADMIN: List all conversations
   */
  @Get('conversations')
  @UseGuards(PermissionsGuard)
  @Permissions('user:read')
  async getConversations(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.chatService.getAdminConversations(Number(page), Number(limit));
  }

  /**
   * ADMIN: Get specific conversation history by UserId (Customer ID)
   */
  @Get('history/:userId')
  @UseGuards(PermissionsGuard)
  @Permissions('user:read')
  async getUserHistory(@Param('userId') userId: string) {
    return this.chatService.getConversation(userId);
  }

  /**
   * USER: Get my own conversation history
   */
  @Get('my-history')
  @ApiOperation({ summary: 'Lấy lịch sử chat' })
  async getMyHistory(@Req() req: RequestWithUser) {
    return this.chatService.getConversation(req.user.userId);
  }
}
