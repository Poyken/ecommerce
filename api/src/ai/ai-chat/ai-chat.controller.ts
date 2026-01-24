import { OptionalJwtAuthGuard } from '@/identity/auth/optional-jwt-auth.guard';
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
 * AI CHAT CONTROLLER - CỔNG TIẾP NHẬN TRUY VẤN KHÁCH HÀNG
 * =====================================================================
 *
 * =====================================================================
 */

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SendMessageSchema = z.object({
  message: z.string().min(1),
  guestId: z.string().optional(),
});

class SendMessageDto extends createZodDto(SendMessageSchema) {}

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
