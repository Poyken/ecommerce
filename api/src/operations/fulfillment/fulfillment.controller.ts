import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FulfillmentService } from './fulfillment.service';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from './dto/fulfillment.dto';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';

import { AppPermission } from '@/common/enums/permissions.enum';

@ApiTags('Fulfillment')
@ApiBearerAuth()
@Controller('admin/fulfillment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(AppPermission.FULFILLMENT_MANAGE)
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Post('shipments')
  @ApiOperation({ summary: 'Tạo lô giao hàng mới' })
  createShipment(@Body() dto: CreateShipmentDto) {
    const tenant = getTenant();
    return this.fulfillmentService.createShipment(tenant!.id, dto);
  }

  @Get('shipments')
  @ApiOperation({ summary: 'Lấy danh sách lô giao hàng' })
  @ApiQuery({ name: 'orderId', required: false })
  getShipments(@Query('orderId') orderId?: string) {
    const tenant = getTenant();
    return this.fulfillmentService.getShipments(tenant!.id, orderId);
  }

  @Get('shipments/:id')
  @ApiOperation({ summary: 'Lấy chi tiết lô giao hàng' })
  getShipmentById(@Param('id') id: string) {
    const tenant = getTenant();
    return this.fulfillmentService.getShipmentById(tenant!.id, id);
  }

  @Put('shipments/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái lô giao hàng' })
  updateShipmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    const tenant = getTenant();
    return this.fulfillmentService.updateShipmentStatus(tenant!.id, id, dto);
  }
}
