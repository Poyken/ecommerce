import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import {
  EarnPointsDto,
  RedeemPointsDto,
  RefundPointsDto,
} from './dto/loyalty.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { getTenant } from '@/core/tenant/tenant.context';
import { AppPermission } from '@/common/enums/permissions.enum';

/**
 * =====================================================================
 * LOYALTY CONTROLLER - QUẢN LÝ ĐIỂM THƯỞNG
 * =====================================================================
 *
 * Endpoints:
 *
 * User:
 * - GET  /loyalty/my-points          - Xem số dư điểm của tôi
 * - GET  /loyalty/my-points/summary  - Tổng quan điểm (balance, expiring, etc.)
 * - GET  /loyalty/my-points/history  - Lịch sử tích/tiêu điểm
 * - POST /loyalty/redeem             - Đổi điểm (khi checkout)
 *
 * Admin:
 * - GET  /loyalty/stats              - Thống kê chung
 * - POST /loyalty/admin/earn         - Tích điểm cho user
 * - POST /loyalty/admin/refund       - Hoàn điểm
 * - GET  /loyalty/users/:userId/balance  - Xem điểm user
 * - GET  /loyalty/users/:userId/history  - Xem lịch sử user
 *
 * =====================================================================
 */
@ApiTags('Loyalty')
@ApiBearerAuth()
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // =====================================================================
  // USER ENDPOINTS (Current User)
  // =====================================================================

  @Get('my-points')
  @ApiOperation({ summary: 'Xem số dư điểm của tôi' })
  async getMyBalance(@GetUser('id') userId: string) {
    const tenant = getTenant();
    return {
      balance: await this.loyaltyService.getAvailableBalance(
        tenant!.id,
        userId,
      ),
    };
  }

  @Get('my-points/summary')
  @ApiOperation({ summary: 'Tổng quan điểm của tôi' })
  async getMySummary(@GetUser('id') userId: string) {
    const tenant = getTenant();
    return this.loyaltyService.getUserLoyaltySummary(tenant!.id, userId);
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
    return this.loyaltyService.getUserPointHistory(tenant!.id, userId, {
      page,
      limit,
    });
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Đổi điểm để giảm giá (khi checkout)' })
  async redeemMyPoints(
    @GetUser('id') userId: string,
    @Body() body: { amount: number; orderId: string; orderTotal?: number },
  ) {
    const tenant = getTenant();
    return this.loyaltyService.redeemPoints(tenant!.id, {
      userId,
      amount: body.amount,
      orderId: body.orderId,
      orderTotal: body.orderTotal,
    });
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Tính toán giá trị điểm' })
  @ApiQuery({ name: 'points', required: true, description: 'Số điểm muốn đổi' })
  calculateRedemption(@Query('points', ParseIntPipe) points: number) {
    return {
      points,
      discountValue: this.loyaltyService.calculateRedemptionValue(points),
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
    return this.loyaltyService.getLoyaltyStats(tenant!.id);
  }

  @Post('admin/earn')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Tích điểm cho user' })
  earnPoints(@Body() dto: EarnPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.earnPoints(tenant!.id, dto);
  }

  @Post('admin/redeem')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Tiêu điểm cho user' })
  adminRedeemPoints(@Body() dto: RedeemPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.redeemPoints(tenant!.id, dto);
  }

  @Post('admin/refund')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Hoàn điểm cho user' })
  refundPoints(@Body() dto: RefundPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.refundPoints(tenant!.id, dto);
  }

  @Post('admin/earn-from-order/:orderId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Tích điểm từ đơn hàng' })
  earnPointsFromOrder(@Param('orderId') orderId: string) {
    const tenant = getTenant();
    return this.loyaltyService.earnPointsFromOrder(tenant!.id, orderId);
  }

  @Get('users/:userId/balance')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Xem số dư điểm của user' })
  async getUserBalance(@Param('userId') userId: string) {
    const tenant = getTenant();
    return {
      userId,
      balance: await this.loyaltyService.getAvailableBalance(
        tenant!.id,
        userId,
      ),
    };
  }

  @Get('users/:userId/summary')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Tổng quan điểm của user' })
  getUserSummary(@Param('userId') userId: string) {
    const tenant = getTenant();
    return this.loyaltyService.getUserLoyaltySummary(tenant!.id, userId);
  }

  @Get('users/:userId/history')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Lịch sử điểm của user' })
  getUserHistory(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const tenant = getTenant();
    return this.loyaltyService.getUserPointHistory(tenant!.id, userId, {
      page,
      limit,
    });
  }

  @Get('orders/:orderId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  @ApiOperation({ summary: '[Admin] Xem điểm liên quan đến đơn hàng' })
  getOrderPoints(@Param('orderId') orderId: string) {
    const tenant = getTenant();
    return this.loyaltyService.getOrderPoints(tenant!.id, orderId);
  }
}
