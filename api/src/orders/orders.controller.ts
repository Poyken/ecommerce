/**
 * =====================================================================
 * ORDERS CONTROLLER - API xử lý Đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PHÂN QUYỀN (Auth & RBAC):
 * - Controller này phục vụ cả USER thường và ADMIN.
 * - Route `my-orders`: User chỉ xem được đơn của chính mình (`req.user.id`).
 * - Route `findAll` (Admin): Cần quyền `order:read`, xem được tất cả đơn.
 *
 * 2. CÁC TÍNH NĂNG CHÍNH:
 * - `create`: Tạo đơn hàng (Checkout).
 * - `updateStatus`: Admin cập nhật trạng thái (Duyệt, Giao, Hủy).
 * - `cancelMyOrder`: User tự hủy đơn (nếu đơn chưa được xử lý).
 * - `getInvoice`: Xuất dữ liệu hóa đơn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import { PermissionsGuard } from '@/auth/permissions.guard';
import * as requestWithUserInterface from '@/auth/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import {
  ApiCreateResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InvoiceService } from './invoice.service';
import { OrdersExportService } from './orders-export.service';
import { OrdersService } from './orders.service';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { OrderFilterDto } from './dto/order-filter.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
    private readonly exportService: OrdersExportService,
  ) {}

  @Get('export/excel')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('order:read')
  @ApiOperation({ summary: 'Export Orders to Excel' })
  async export(@Res() res: Response): Promise<void> {
    return this.exportService.exportToExcel(res);
  }

  @Post()
  @ApiCreateResponse('Order', { summary: 'Thanh toán / Tạo đơn hàng' })
  async create(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const data = await this.ordersService.create(req.user.id, createOrderDto);
    return { data };
  }

  @Get('my-orders')
  @ApiListResponse('Order', {
    summary: 'Lấy lịch sử đơn hàng của người dùng hiện tại',
  })
  async findMyOrders(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.ordersService.findAllByUser(
      req.user.id,
      Number(page),
      Number(limit),
    );
  }

  @Get('my-orders/:id')
  @ApiGetOneResponse('Order', { summary: 'Lấy chi tiết một đơn hàng cụ thể' })
  async findOneMyOrder(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('id') id: string,
  ) {
    // TODO: Thêm kiểm tra quyền sở hữu bên trong service (đã có check owner)
    const data = await this.ordersService.findOne(id, req.user.id);
    return { data };
  }

  // Các route Admin
  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('order:read')
  @ApiListResponse('Order', { summary: 'Lấy tất cả đơn hàng (Admin)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  findAll(@Query() filters: OrderFilterDto) {
    return this.ordersService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('order:read')
  @ApiGetOneResponse('Order', { summary: 'Lấy chi tiết đơn hàng (Admin)' })
  async findOne(@Param('id') id: string) {
    const data = await this.ordersService.findOneAdmin(id);
    return { data };
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('order:update')
  @ApiUpdateResponse('Order', {
    summary: 'Cập nhật trạng thái đơn hàng (Admin)',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const data = await this.ordersService.updateStatus(id, dto);
    return { data };
  }

  @Patch('my-orders/:id/cancel')
  @ApiUpdateResponse('Order', { summary: 'Hủy đơn hàng của chính mình (User)' })
  async cancelMyOrder(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('id') id: string,
    @Body() dto: { cancellationReason: string },
  ) {
    const data = await this.ordersService.cancelMyOrder(
      req.user.id,
      id,
      dto.cancellationReason,
    );
    return { data };
  }

  @Get(':id/invoice')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('order:read')
  @ApiGetOneResponse('Invoice', { summary: 'Lấy dữ liệu hóa đơn (Admin)' })
  async getInvoice(@Param('id') id: string) {
    const data = await this.invoiceService.generateInvoiceData(id);
    return { data };
  }
}
