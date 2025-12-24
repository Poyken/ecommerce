import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('FeatureFlags')
@Controller('feature-flags')
export class FeatureFlagsPublicController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getMyFlags(@Req() req: any) {
    const userId = req.user?.id;
    const environment = process.env.NODE_ENV || 'development';

    return this.featureFlagsService.getEnabledFlagsForContext({
      userId,
      environment,
    });
  }
}
