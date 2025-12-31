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

/**
 * =====================================================================
 * ORDERS CONTROLLER - Điều hướng yêu cầu về đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ROLE-BASED ACCESS CONTROL (RBAC):
 * - Hệ thống phân biệt rõ ràng giữa route cho người dùng (`my-orders`) và route cho Admin.
 * - `@Permissions('order:read')`: Sử dụng Custom Decorator kết hợp với `PermissionsGuard` để kiểm tra quyền hạn chi tiết của Admin.
 *
 * 2. PARAMETER HANDLING:
 * - `@Query()`: Dùng để lấy các tham số lọc, tìm kiếm và phân trang từ URL (VD: `?page=1&limit=10`).
 * - `@Param('id')`: Dùng để lấy ID đơn hàng từ đường dẫn (VD: `/orders/123`).
 *
 * 3. SWAGGER DOCUMENTATION:
 * - `@ApiOperation`: Mô tả ngắn gọn chức năng của từng API, giúp tài liệu Swagger dễ hiểu hơn cho các thành viên khác trong team.
 * =====================================================================
 */
import { Permissions } from '@/auth/decorators/permissions.decorator';
import * as requestWithUserInterface from '@/auth/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InvoiceService } from './invoice.service';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Thanh toán / Tạo đơn hàng' })
  async create(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const data = await this.ordersService.create(req.user.id, createOrderDto);
    return { data };
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Lấy lịch sử đơn hàng của người dùng hiện tại' })
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
  @ApiOperation({ summary: 'Lấy chi tiết một đơn hàng cụ thể' })
  async findOneMyOrder(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('id') id: string,
  ) {
    // TODO: Thêm kiểm tra quyền sở hữu bên trong service
    const data = await this.ordersService.findOne(id, req.user.id);
    return { data };
  }

  // Các route Admin
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('order:read')
  @ApiOperation({ summary: 'Lấy tất cả đơn hàng (Admin)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('includeItems') includeItems?: string,
    @Query('userId') userId?: string,
  ) {
    return this.ordersService.findAll(
      search,
      status, // Pass status to service
      Number(page),
      Number(limit),
      includeItems === 'true',
      userId,
    );
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('order:read')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng (Admin)' })
  async findOne(@Param('id') id: string) {
    const data = await this.ordersService.findOneAdmin(id);
    return { data };
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permissions('order:update')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const data = await this.ordersService.updateStatus(id, dto);
    return { data };
  }

  @Patch('my-orders/:id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng của chính mình (User)' })
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
  @Permissions('order:read')
  @ApiOperation({ summary: 'Lấy dữ liệu hóa đơn (Admin)' })
  async getInvoice(@Param('id') id: string) {
    const data = await this.invoiceService.generateInvoiceData(id);
    return { data };
  }
}
