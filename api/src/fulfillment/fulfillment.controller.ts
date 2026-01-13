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
import { FulfillmentService } from './fulfillment.service';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from './dto/fulfillment.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';

@Controller('admin/fulfillment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('admin:all')
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Post('shipments')
  createShipment(@Body() dto: CreateShipmentDto) {
    const tenant = getTenant();
    return this.fulfillmentService.createShipment(tenant!.id, dto);
  }

  @Get('shipments')
  getShipments(@Query('orderId') orderId?: string) {
    const tenant = getTenant();
    return this.fulfillmentService.getShipments(tenant!.id, orderId);
  }

  @Get('shipments/:id')
  getShipmentById(@Param('id') id: string) {
    const tenant = getTenant();
    return this.fulfillmentService.getShipmentById(tenant!.id, id);
  }

  @Put('shipments/:id/status')
  updateShipmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ) {
    const tenant = getTenant();
    return this.fulfillmentService.updateShipmentStatus(tenant!.id, id, dto);
  }
}
