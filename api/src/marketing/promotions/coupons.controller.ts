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
  BadRequestException,
} from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { getTenant } from '@core/tenant/tenant.context';

// Use Cases
import {
  CreatePromotionUseCase,
  ListPromotionsUseCase,
  GetPromotionUseCase,
  UpdatePromotionUseCase,
  DeletePromotionUseCase,
} from './application/use-cases';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly createUseCase: CreatePromotionUseCase,
    private readonly listUseCase: ListPromotionsUseCase,
    private readonly getUseCase: GetPromotionUseCase,
    private readonly updateUseCase: UpdatePromotionUseCase,
    private readonly deleteUseCase: DeletePromotionUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new coupon (Promotion with code)' })
  async create(@Body() dto: CreatePromotionDto) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.createUseCase.execute({
      ...dto,
      tenantId: tenant.id,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.promotion.toPersistence() };
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
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.listUseCase.execute({
      tenantId: tenant.id,
      page,
      limit,
      search,
      // Ideally we filter by having a 'code' here in the use case or repository
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return {
      data: result.value.data.map((p) => p.toPersistence()),
      meta: result.value.meta,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon details' })
  async findOne(@Param('id') id: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.getUseCase.execute({ id, tenantId: tenant.id });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.promotion.toPersistence() };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update coupon' })
  async update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.updateUseCase.execute({
      ...dto,
      id,
      tenantId: tenant.id,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    } as any);

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.promotion.toPersistence() };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete coupon' })
  async remove(@Param('id') id: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.deleteUseCase.execute({
      id,
      tenantId: tenant.id,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }
}
