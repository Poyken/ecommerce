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
