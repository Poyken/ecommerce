import { OptionalJwtAuthGuard } from '@/auth/optional-jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiChatService } from './ai-chat.service';

/**
 * =====================================================================
 * AI CHAT CONTROLLER - API endpoints cho tính năng chat AI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. OPTIONAL AUTH (`OptionalJwtAuthGuard`):
 * - Khác với `JwtAuthGuard` thông thường yêu cầu phải đăng nhập.
 * - Optional guard cho phép cả guest và logged-in user truy cập.
 * - Nếu có token, req.user sẽ có data; nếu không, req.user = undefined.
 *
 * 2. RATE LIMITING (`@Throttle`):
 * - Giới hạn số request/thời gian để tránh lạm dụng API.
 * - Guest: 10 requests/minute
 * - Logged-in: 30 requests/minute
 *
 * 3. DTO VALIDATION:
 * - `SendMessageDto`: Validate tin nhắn từ client
 * - Sử dụng class-validator để đảm bảo data hợp lệ *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  guestId?: string; // UUID from localStorage for guest users
}

@ApiTags('AI Chat')
@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('message')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Gửi tin nhắn cho AI và nhận phản hồi' })
  @ApiBearerAuth()
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    const userId = req.user?.id;
    const guestId = !userId ? dto.guestId : undefined;

    const result = await this.aiChatService.sendMessage(
      dto.message,
      userId,
      guestId,
    );

    return {
      data: {
        response: result.response,
        sessionId: result.sessionId,
      },
    };
  }

  @Get('history')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy lịch sử chat (chỉ cho logged-in users)' })
  @ApiBearerAuth()
  async getHistory(@Request() req) {
    const userId = req.user?.id;

    if (!userId) {
      return {
        data: [],
        message: 'Guest users do not have persistent history',
      };
    }

    const history = await this.aiChatService.getHistory(userId);

    return {
      data: history,
    };
  }
}
