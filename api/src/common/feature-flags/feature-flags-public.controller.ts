import type { RequestWithUser } from '@/auth/interfaces/request-with-user.interface';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';

// ... (comments)

@ApiTags('FeatureFlags')
@Controller('feature-flags')
export class FeatureFlagsPublicController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get('my-flags')
  @UseGuards(OptionalJwtAuthGuard)
  async getMyFlags(@Req() req: RequestWithUser) {
    const userId = req.user?.id;
    const environment = process.env.NODE_ENV || 'development';

    return this.featureFlagsService.getEnabledFlagsForContext({
      userId,
      environment,
    });
  }
}
