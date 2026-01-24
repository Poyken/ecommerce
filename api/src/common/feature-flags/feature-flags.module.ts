import { Module } from '@nestjs/common';
import { FeatureFlagsPublicController } from './feature-flags-public.controller';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  controllers: [FeatureFlagsPublicController, FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
/**
 * =====================================================================
 * FEATURE FLAGS MODULE
 * =====================================================================
 *
 * =====================================================================
 */
export class FeatureFlagsModule {}
