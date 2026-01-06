import {
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { InsightsService } from './insights.service';
import { getTenant } from '@core/tenant/tenant.context';

@ApiTags('AI Insights')
@Controller('insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  /**
   * Lấy AI Insights cho Dashboard
   */
  @Get()
  @ApiOperation({ summary: 'Get AI-powered business insights for dashboard' })
  async getInsights() {
    const tenant = getTenant();
    if (!tenant) {
      throw new BadRequestException('Tenant context not found');
    }
    const insights = await this.insightsService.getInsightsForTenant(tenant.id);
    return {
      success: true,
      data: insights,
    };
  }

  /**
   * Force refresh insights (manual trigger)
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Force refresh insights for current tenant' })
  async refreshInsights() {
    const tenant = getTenant();
    if (!tenant) {
      throw new BadRequestException('Tenant context not found');
    }
    const insights = await this.insightsService.generateInsightsForTenant(
      tenant.id,
    );
    return {
      success: true,
      data: insights,
    };
  }
}
