/**
 * =====================================================================
 * RAG CONTROLLER - CỔNG TRUY XUẤT KIẾN THỨC NÂNG CAO
 * =====================================================================
 *
 * =====================================================================
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { RagService } from './rag.service';
import { getTenant } from '@core/tenant/tenant.context';

@ApiTags('RAG Chatbot')
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  /**
   * Chatbot endpoint - Public API for customer chat
   */
  @Post('chat')
  @ApiOperation({ summary: 'Answer customer question using RAG' })
  async chat(
    @Body() body: { question: string; tenantId: string; history?: any[] },
  ) {
    if (!body.question || !body.tenantId) {
      throw new BadRequestException('Question and tenantId are required');
    }

    const answer = await this.ragService.answer(
      body.tenantId,
      body.question,
      body.history || [],
    );

    return {
      success: true,
      data: {
        answer,
        suggestedQuestions: this.ragService.getSuggestedQuestions(),
      },
    };
  }

  /**
   * Admin: Refresh knowledge base
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh knowledge base for current tenant' })
  async refreshKnowledge() {
    const tenant = getTenant();
    if (!tenant) {
      throw new BadRequestException('Tenant context not found');
    }

    const result = await this.ragService.refreshKnowledge(tenant.id);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Admin: Set shop policy
   */
  @Post('policy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set shop policy for RAG chatbot' })
  async setPolicy(
    @Body()
    body: {
      type: 'shipping' | 'return' | 'payment' | 'contact';
      content: string;
    },
  ) {
    const tenant = getTenant();
    if (!tenant) {
      throw new BadRequestException('Tenant context not found');
    }

    await this.ragService.setPolicy(tenant.id, body.type, body.content);
    return {
      success: true,
      message: `Policy ${body.type} updated`,
    };
  }

  /**
   * Get suggested questions
   */
  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested questions for chatbot' })
  getSuggestions() {
    return {
      success: true,
      data: this.ragService.getSuggestedQuestions(),
    };
  }
}
