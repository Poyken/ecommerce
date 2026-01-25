/**
 * =====================================================================
 * ORDERS CONTROLLER - API xử lý Đơn hàng
 * =====================================================================
 */

import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import * as requestWithUserInterface from '@/identity/auth/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
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
  BadRequestException,
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
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { OrderFilterDto } from './dto/order-filter.dto';
import { getTenant } from '@core/tenant/tenant.context';

import {
  PlaceOrderUseCase,
  UpdateOrderStatusUseCase,
  ListOrdersUseCase,
  GetOrderUseCase,
  CancelOrderUseCase,
} from './application/use-cases';
import { InitiatePaymentUseCase } from '../payment/application/use-cases';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly initiatePaymentUseCase: InitiatePaymentUseCase,
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
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.placeOrderUseCase.execute({
      userId: req.user.id,
      tenantId: tenant.id,
      items: (createOrderDto.items as any[]).map((i) => ({
        skuId: i.skuId,
        quantity: i.quantity,
      })),
      recipientName: createOrderDto.recipientName,
      phoneNumber: createOrderDto.phoneNumber,
      shippingAddress: createOrderDto.shippingAddress,
      shippingCity: createOrderDto.shippingCity,
      shippingDistrict: createOrderDto.shippingDistrict,
      shippingWard: createOrderDto.shippingWard,
      shippingPhone: createOrderDto.shippingPhone,
      paymentMethod: createOrderDto.paymentMethod || 'COD',
      couponCode: createOrderDto.couponCode,
      returnUrl: createOrderDto.returnUrl,
      addressId: createOrderDto.addressId,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    // NEW: Trigger Payment if not COD
    let paymentUrl: string | undefined;
    if (
      createOrderDto.paymentMethod &&
      createOrderDto.paymentMethod !== 'COD'
    ) {
      const paymentResult = await this.initiatePaymentUseCase.execute({
        orderId: result.value.orderId,
        method: createOrderDto.paymentMethod,
        returnUrl: createOrderDto.returnUrl,
        ipAddr: req.ip,
      });
      if (paymentResult.isSuccess) {
        paymentUrl = paymentResult.value.paymentUrl;
      }
    }

    return {
      orderId: result.value.orderId,
      totalAmount: result.value.totalAmount,
      paymentUrl,
    };
  }

  @Get()
  @ApiListResponse('Order', { summary: 'Danh sách đơn hàng (Filter)' })
  @ApiQuery({ type: OrderFilterDto })
  async findAll(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Query() filters: OrderFilterDto,
  ) {
    const tenant = getTenant();
    const result = await this.listOrdersUseCase.execute({
      ...filters,
      userId: req.user.id,
      tenantId: tenant?.id,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  @Get(':id')
  @ApiGetOneResponse('Order', { summary: 'Chi tiết đơn hàng' })
  async findOne(
    @Param('id') id: string,
    @Request() req: requestWithUserInterface.RequestWithUser,
  ) {
    const result = await this.getOrderUseCase.execute({
      id,
      userId: req.user.id,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { data: result.value.order };
  }

  @Get('my-orders/:id')
  @ApiGetOneResponse('Order', { summary: 'Chi tiết đơn hàng của tôi' })
  async findMyOrder(
    @Param('id') id: string,
    @Request() req: requestWithUserInterface.RequestWithUser,
  ) {
    return this.findOne(id, req);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('order:update')
  @ApiUpdateResponse('Order', { summary: 'Cập nhật trạng thái đơn hàng' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    const result = await this.updateOrderStatusUseCase.execute({
      orderId: id,
      status: updateStatusDto.status,
      reason: updateStatusDto.note,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { data: result.value };
  }

  @Patch(':id/cancel')
  @ApiUpdateResponse('Order', { summary: 'Hủy đơn hàng' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    const result = await this.cancelOrderUseCase.execute({
      orderId: id,
      reason,
      userId: req.user.id,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { success: true };
  }
}
