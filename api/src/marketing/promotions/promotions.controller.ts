import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Get,
  Query,
  UseGuards,
  Param,
  Patch,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import {
  ValidatePromotionDto,
  ApplyPromotionDto,
} from './dto/validate-promotion.dto';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { GetUser } from '@/identity/auth/decorators/get-user.decorator';
import { getTenant } from '@core/tenant/tenant.context';

// Use Cases
import {
  CreatePromotionUseCase,
  ListPromotionsUseCase,
  GetPromotionUseCase,
  UpdatePromotionUseCase,
  DeletePromotionUseCase,
  ValidatePromotionUseCase,
  ApplyPromotionUseCase,
  GetPromotionStatsUseCase,
  GetAvailablePromotionsUseCase,
} from './application/use-cases';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(
    private readonly createUseCase: CreatePromotionUseCase,
    private readonly listUseCase: ListPromotionsUseCase,
    private readonly getUseCase: GetPromotionUseCase,
    private readonly updateUseCase: UpdatePromotionUseCase,
    private readonly deleteUseCase: DeletePromotionUseCase,
    private readonly validateUseCase: ValidatePromotionUseCase,
    private readonly applyUseCase: ApplyPromotionUseCase,
    private readonly statsUseCase: GetPromotionStatsUseCase,
    private readonly availableUseCase: GetAvailablePromotionsUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo chương trình khuyến mãi mới' })
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
  @ApiOperation({ summary: 'Lấy danh sách chương trình khuyến mãi' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.listUseCase.execute({
      tenantId: tenant.id,
      page,
      limit,
      search,
      isActive: isActive ? isActive === 'true' : undefined,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return {
      data: result.value.data.map((p) => p.toPersistence()),
      meta: result.value.meta,
    };
  }

  @Get('available')
  @ApiOperation({ summary: 'Lấy danh sách khuyến mãi khả dụng' })
  async getAvailable(
    @Query('totalAmount') totalAmount?: string,
    @GetUser('id') userId?: string,
  ) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.availableUseCase.execute({
      tenantId: tenant.id,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      userId,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return { data: result.value.promotions.map((p) => p.toPersistence()) };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Kiểm tra mã khuyến mãi' })
  async validate(@Body() dto: ValidatePromotionDto) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.validateUseCase.execute({
      tenantId: tenant.id,
      ...dto,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value };
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Áp dụng mã khuyến mãi' })
  async apply(@Body() dto: ApplyPromotionDto, @GetUser('id') userId: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.applyUseCase.execute({
      tenantId: tenant.id,
      userId,
      ...dto,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết khuyến mãi' })
  async findOne(@Param('id') id: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.getUseCase.execute({ id, tenantId: tenant.id });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.promotion.toPersistence() };
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thống kê sử dụng' })
  async getStats(@Param('id') id: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.statsUseCase.execute({ id, tenantId: tenant.id });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return {
      data: {
        promotion: result.value.promotion.toPersistence(),
        stats: result.value.stats,
      },
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật khuyến mãi' })
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

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bật/Tắt khuyến mãi' })
  async toggleActive(@Param('id') id: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const promoResult = await this.getUseCase.execute({
      id,
      tenantId: tenant.id,
    });
    if (promoResult.isFailure)
      throw new BadRequestException(promoResult.error.message);

    const result = await this.updateUseCase.execute({
      id,
      tenantId: tenant.id,
      isActive: !promoResult.value.promotion.isActive,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.promotion.toPersistence() };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('promotion:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa khuyến mãi' })
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
