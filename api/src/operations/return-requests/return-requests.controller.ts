import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  Delete,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { ReturnRequestsService } from './return-requests.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';
import { ReturnStatus } from '@prisma/client';

/**
 * =====================================================================
 * RETURN REQUESTS CONTROLLER (RMA)
 * =====================================================================
 *
 * Endpoints:
 * Customer:
 * - POST   /return-requests           - Tạo yêu cầu đổi trả
 * - GET    /return-requests/my-returns - Danh sách yêu cầu của tôi
 * - PATCH  /return-requests/:id/tracking - Cập nhật mã vận đơn
 * - DELETE /return-requests/:id/cancel - Hủy yêu cầu
 *
 * Admin:
 * - GET    /return-requests           - Danh sách tất cả
 * - GET    /return-requests/stats     - Thống kê
 * - GET    /return-requests/:id       - Chi tiết
 * - PATCH  /return-requests/:id       - Cập nhật trạng thái
 * - PATCH  /return-requests/:id/approve - Duyệt yêu cầu
 * - PATCH  /return-requests/:id/reject - Từ chối
 * - PATCH  /return-requests/:id/received - Xác nhận nhận hàng
 * - PATCH  /return-requests/:id/refund - Hoàn tiền
 *
 * =====================================================================
 */
@ApiTags('Return Requests (RMA)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('return-requests')
export class ReturnRequestsController {
  constructor(private readonly returnRequestsService: ReturnRequestsService) {}

  // ============================================================
  // CUSTOMER ENDPOINTS
  // ============================================================

  @Post()
  @ApiOperation({ summary: 'Create a new Return Request (Customer)' })
  create(@Req() req, @Body() dto: CreateReturnRequestDto) {
    return this.returnRequestsService.create(
      req.user.id,
      req.user.tenantId,
      dto,
    );
  }

  @Get('my-returns')
  @ApiOperation({ summary: 'List my Return Requests (Customer)' })
  findMyReturns(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.returnRequestsService.findAllByUser(
      req.user.id,
      req.user.tenantId,
      page,
      limit,
    );
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: 'Update Tracking Code (Customer)' })
  updateTracking(
    @Param('id') id: string,
    @Body() body: { trackingCode: string; carrier: string },
    @Req() req,
  ) {
    return this.returnRequestsService.updateTracking(
      id,
      req.user.id,
      body.trackingCode,
      body.carrier,
    );
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel Return Request (Customer)' })
  cancel(@Param('id') id: string, @Req() req) {
    return this.returnRequestsService.cancel(id, req.user.id);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  @Get('stats')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('return-request:read')
  @ApiOperation({ summary: 'Get Return Request Statistics (Admin)' })
  getStats(@Req() req) {
    return this.returnRequestsService.getStats(req.user.tenantId);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('return-request:read')
  @ApiOperation({ summary: 'List all Return Requests (Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: ReturnStatus })
  findAll(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: ReturnStatus,
    @Query('search') search?: string,
  ) {
    return this.returnRequestsService.findAll(req.user.tenantId, {
      page,
      limit,
      status,
      search,
    });
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('return-request:read')
  @ApiOperation({ summary: 'Get Return Request Details (Admin)' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.returnRequestsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('return-request:update')
  @ApiOperation({ summary: 'Update Return Request (Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReturnRequestDto,
    @Req() req,
  ) {
    return this.returnRequestsService.update(id, dto, req.user.tenantId);
  }

  @Patch(':id/approve')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('return-request:update')
  @ApiOperation({ summary: 'Approve Return Request (Admin)' })
  approve(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req,
  ) {
    return this.returnRequestsService.approve(
      id,
      req.user.tenantId,
      body.notes,
    );
  }

  @Patch(':id/reject')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('return-request:update')
  @ApiOperation({ summary: 'Reject Return Request (Admin)' })
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req,
  ) {
    return this.returnRequestsService.reject(
      id,
      req.user.tenantId,
      body.reason,
    );
  }

  @Patch(':id/received')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('return-request:update')
  @ApiOperation({ summary: 'Confirm Item Received (Admin)' })
  confirmReceived(@Param('id') id: string, @Req() req) {
    return this.returnRequestsService.confirmReceived(id, req.user.tenantId);
  }

  @Patch(':id/refund')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('return-request:update')
  @ApiOperation({ summary: 'Process Refund (Admin)' })
  processRefund(
    @Param('id') id: string,
    @Body() body: { refundAmount?: number },
    @Req() req,
  ) {
    return this.returnRequestsService.processRefund(
      id,
      req.user.tenantId,
      body.refundAmount,
    );
  }
}
