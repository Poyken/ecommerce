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
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Thanh toán / Tạo đơn hàng' })
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Lấy lịch sử đơn hàng của người dùng hiện tại' })
  findMyOrders(@Request() req) {
    return this.ordersService.findAllByUser(req.user.id);
  }

  @Get('my-orders/:id')
  @ApiOperation({ summary: 'Lấy chi tiết một đơn hàng cụ thể' })
  findOneMyOrder(@Request() req, @Param('id') id: string) {
    // TODO: Thêm kiểm tra quyền sở hữu bên trong service
    return this.ordersService.findOne(id, req.user.id);
  }

  // Các route Admin
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('order:read')
  @ApiOperation({ summary: 'Lấy tất cả đơn hàng (Admin)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search?: string) {
    return this.ordersService.findAll(search);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('order:read')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng (Admin)' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permissions('order:update')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng (Admin)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
