import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from './dto/feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('Admin - Feature Flags')
@ApiBearerAuth()
@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('admin:write')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @Permissions('admin:read')
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlagsService.create(dto);
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.featureFlagsService.update(key, dto);
  }

  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.featureFlagsService.remove(key);
  }
}
