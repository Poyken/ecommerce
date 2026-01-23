import type { RequestWithUser } from '@/identity/auth/interfaces/request-with-user.interface';
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import {
  ApiGetOneResponse,
  ApiListResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
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
 * - API `/my-history` giúp khách hàng load lại tin nhắn của chính họ khi F5 trang web hoặc chuyển đổi thiết bị. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, validate dữ liệu và điều phối xử lý logic thông qua các Service tương ứng.

 * =====================================================================
 */
@ApiTags('Chat Support')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * ADMIN: List all conversations
   */
  @Get('conversations')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('chat:read')
  @ApiListResponse('Conversation', {
    summary: 'Lấy danh sách cuộc trò chuyện (Admin)',
  })
  async getConversations(@Query('page') page = 1, @Query('limit') limit = 20) {
    const result = await this.chatService.getAdminConversations(
      Number(page),
      Number(limit),
    );
    // If service already returns { data, meta }, return as-is
    if (result && 'data' in result && 'meta' in result) {
      return result;
    }
    // Otherwise wrap
    return { data: result };
  }

  /**
   * ADMIN: Get specific conversation history by UserId (Customer ID)
   */
  @Get('history/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('chat:read')
  @ApiGetOneResponse('Conversation', {
    summary: 'Lấy lịch sử trò chuyện của một user (Admin)',
  })
  async getUserHistory(@Param('userId') userId: string) {
    const data = await this.chatService.getConversation(userId);
    return { data };
  }

  /**
   * USER: Get my own conversation history
   */
  @Get('my-history')
  @ApiGetOneResponse('Conversation', { summary: 'Lấy lịch sử chat của tôi' })
  async getMyHistory(@Req() req: RequestWithUser) {
    const data = await this.chatService.getConversation(req.user.userId);
    return { data };
  }
}
