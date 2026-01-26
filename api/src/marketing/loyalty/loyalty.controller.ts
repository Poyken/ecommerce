import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  EarnPointsDto,
  RedeemPointsDto,
  RefundPointsDto,
} from './dto/loyalty.dto';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { GetUser } from '@/identity/auth/decorators/get-user.decorator';
import { getTenant } from '@/core/tenant/tenant.context';
import { AppPermission } from '@/common/enums/permissions.enum';

// Use Cases
import {
  EarnPointsUseCase,
  RedeemPointsUseCase,
  RefundPointsUseCase,
  GetLoyaltySummaryUseCase,
  GetLoyaltyHistoryUseCase,
  GetLoyaltyStatsUseCase,
  GetOrderLoyaltyUseCase,
} from './application/use-cases';
import { LOYALTY_CONFIG } from './domain/entities/loyalty-config';

@ApiTags('Loyalty')
@ApiBearerAuth()
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(
    private readonly earnPointsUseCase: EarnPointsUseCase,
    private readonly redeemPointsUseCase: RedeemPointsUseCase,
    private readonly refundPointsUseCase: RefundPointsUseCase,
    private readonly getSummaryUseCase: GetLoyaltySummaryUseCase,
    private readonly getHistoryUseCase: GetLoyaltyHistoryUseCase,
    private readonly getStatsUseCase: GetLoyaltyStatsUseCase,
    private readonly getOrderLoyaltyUseCase: GetOrderLoyaltyUseCase,
  ) {}

  @Get('my-points')
  @ApiOperation({ summary: 'Xem số dư điểm của tôi' })
  async getMyBalance(@GetUser('id') userId: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant missing');

    const result = await this.getSummaryUseCase.execute({
      tenantId: tenant.id,
      userId,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return { balance: result.value.balance };
  }

  @Get('my-points/summary')
  @ApiOperation({ summary: 'Tổng quan điểm của tôi' })
  async getMySummary(@GetUser('id') userId: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant missing');

    const result = await this.getSummaryUseCase.execute({
      tenantId: tenant.id,
      userId,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return { data: result.value };
  }

  @Get('my-points/history')
  @ApiOperation({ summary: 'Lịch sử điểm của tôi' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyHistory(
    @GetUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant missing');

    const result = await this.getHistoryUseCase.execute({
      tenantId: tenant.id,
      userId,
      page,
      limit,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return {
      data: result.value.data.map((p) => p.toPersistence()),
      meta: result.value.meta,
    };
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Đổi điểm để giảm giá (khi checkout)' })
  async redeemMyPoints(
    @GetUser('id') userId: string,
    @Body() body: { amount: number; orderId: string; orderTotal?: number },
  ) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant missing');

    const result = await this.redeemPointsUseCase.execute({
      tenantId: tenant.id,
      userId,
      ...body,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value };
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Tính toán giá trị điểm' })
  @ApiQuery({ name: 'points', required: true, description: 'Số điểm muốn đổi' })
  calculateRedemption(@Query('points', ParseIntPipe) points: number) {
    return {
      points,
      discountValue: points * LOYALTY_CONFIG.POINT_VALUE,
    };
  }

  // =====================================================================
  // ADMIN ENDPOINTS
  // =====================================================================

  @Get('stats')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Thống kê điểm thưởng' })
  async getStats() {
    const tenant = getTenant();
    const result = await this.getStatsUseCase.execute({ tenantId: tenant!.id });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value };
  }

  @Post('admin/earn')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Tích điểm cho user' })
  async earnPoints(@Body() dto: EarnPointsDto) {
    const tenant = getTenant();
    const result = await this.earnPointsUseCase.execute({
      tenantId: tenant!.id,
      ...dto,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.loyaltyPoint.toPersistence() };
  }

  @Post('admin/redeem')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Tiêu điểm cho user' })
  async adminRedeemPoints(@Body() dto: RedeemPointsDto) {
    const tenant = getTenant();
    const result = await this.redeemPointsUseCase.execute({
      tenantId: tenant!.id,
      ...dto,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value };
  }

  @Post('admin/refund')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Hoàn điểm cho user' })
  async refundPoints(@Body() dto: RefundPointsDto) {
    const tenant = getTenant();
    if (!dto.orderId)
      throw new BadRequestException('Order ID is required for refund');

    const result = await this.refundPointsUseCase.execute({
      tenantId: tenant!.id,
      ...dto,
      orderId: dto.orderId,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.loyaltyPoint?.toPersistence() };
  }

  @Post('admin/earn-from-order/:orderId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Tích điểm từ đơn hàng' })
  async earnPointsFromOrder(@Param('orderId') orderId: string) {
    const tenant = getTenant();
    const result = await this.earnPointsUseCase.execute({
      tenantId: tenant!.id,
      orderId,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.loyaltyPoint.toPersistence() };
  }

  @Get('users/:userId/balance')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Xem số dư điểm của user' })
  async getUserBalance(@Param('userId') userId: string) {
    const tenant = getTenant();
    const result = await this.getSummaryUseCase.execute({
      tenantId: tenant!.id,
      userId,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return { userId, balance: result.value.balance };
  }

  @Get('users/:userId/summary')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Tổng quan điểm của user' })
  async getUserSummary(@Param('userId') userId: string) {
    const tenant = getTenant();
    const result = await this.getSummaryUseCase.execute({
      tenantId: tenant!.id,
      userId,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return { data: result.value };
  }

  @Get('users/:userId/history')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Lịch sử điểm của user' })
  async getUserHistory(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const tenant = getTenant();
    const result = await this.getHistoryUseCase.execute({
      tenantId: tenant!.id,
      userId,
      page,
      limit,
    });

    if (result.isFailure) throw new BadRequestException(result.error.message);

    return {
      data: result.value.data.map((p) => p.toPersistence()),
      meta: result.value.meta,
    };
  }

  @Get('orders/:orderId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Xem điểm liên quan đến đơn hàng' })
  async getOrderPoints(@Param('orderId') orderId: string) {
    const tenant = getTenant();
    const result = await this.getOrderLoyaltyUseCase.execute({
      tenantId: tenant!.id,
      orderId,
    });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { data: result.value.map((p) => p.toPersistence()) };
  }
}
