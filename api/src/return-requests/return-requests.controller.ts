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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { ReturnRequestsService } from './return-requests.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';

@ApiTags('Return Requests (RMA)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('return-requests')
export class ReturnRequestsController {
  constructor(private readonly returnRequestsService: ReturnRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Return Request (User)' })
  create(@Req() req, @Body() dto: CreateReturnRequestDto) {
    return this.returnRequestsService.create(
      req.user.id,
      req.user.tenantId,
      dto,
    );
  }

  @Get('my-returns')
  @ApiOperation({ summary: 'List Return Requests for current user' })
  findMyReturns(@Req() req, @Query('page') page = 1) {
    return this.returnRequestsService.findAllByUser(
      req.user.id,
      req.user.tenantId,
      +page,
    );
  }

  @Get()
  @RequirePermissions('return_request:read')
  @ApiOperation({ summary: 'List Return Requests (Admin)' })
  findAll(@Req() req, @Query('page') page = 1) {
    return this.returnRequestsService.findAll(req.user.tenantId, +page);
  }

  @Get(':id')
  @RequirePermissions('return_request:read')
  @ApiOperation({ summary: 'Get Return Request Details' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.returnRequestsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @RequirePermissions('return_request:update')
  @ApiOperation({ summary: 'Update Return Request Status/Inspection (Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReturnRequestDto,
    @Req() req,
  ) {
    return this.returnRequestsService.update(id, dto, req.user.tenantId);
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: 'Update Tracking Code (User)' })
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
}
