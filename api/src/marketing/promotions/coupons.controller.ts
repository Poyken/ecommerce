import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new coupon (Promotion with code)' })
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    // Force having a code if it's hitting the /coupons endpoint?
    // Or just let the service handle it.
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List coupons' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    // Reuse findAll from promotions.
    // Ideally we filter by having a 'code' here, but the service might not support it yet.
    // For now, mapping /coupons to /promotions logic is the fix.
    return this.promotionsService.findAll({ page, limit, search });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon details' })
  async findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update coupon' })
  async update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete coupon' })
  async remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
