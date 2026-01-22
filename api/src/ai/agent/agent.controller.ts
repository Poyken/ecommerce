/**
 * =====================================================================
 * AGENT.CONTROLLER CONTROLLER
 * =====================================================================
 *
 * =====================================================================
 */

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { AgentService } from './agent.service';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ExecuteCommandSchema = z.object({
  command: z.string().min(1),
});

export class ExecuteCommandDto extends createZodDto(ExecuteCommandSchema) {}

@ApiTags('AI Agent')
@Controller('agent')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * Thực thi một lệnh từ Admin
   * VD: "Giảm giá 20% cho tất cả áo phông có tồn kho trên 50"
   */
  @Post('execute')
  @ApiOperation({ summary: 'Execute an admin command using AI Agent' })
  async executeCommand(@Body() dto: ExecuteCommandDto) {
    const result = await this.agentService.executeCommand(dto.command);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Generative UI - Tạo giao diện động dựa trên câu hỏi
   * VD: "Cho tôi xem doanh số tuần này"
   */
  @Post('generate-ui')
  @ApiOperation({ summary: 'Generate dynamic UI based on query' })
  async generateUI(@Body() dto: ExecuteCommandDto) {
    const result = await this.agentService.generateUI(dto.command);
    return {
      success: true,
      data: result,
    };
  }
}
