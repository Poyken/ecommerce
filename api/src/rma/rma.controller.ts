import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RmaService } from './rma.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { ReturnStatus } from '@prisma/client';
// import { PermissionsGuard } from '@/auth/permissions.guard';
// import { RequirePermissions } from '@/common/decorators/crud.decorators';

@Controller('rma')
export class RmaController {
  constructor(private readonly rmaService: RmaService) {}

  /**
   * Khách hàng tạo yêu cầu hoàn trả
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createRequest(@Req() req, @Body() dto: CreateReturnRequestDto) {
    const userId = req.user.id;
    return this.rmaService.createRequest(userId, dto);
  }

  /**
   * Admin xem danh sách các yêu cầu
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  // @RequirePermissions('rma:read')
  async findAll(@Query('status') status?: ReturnStatus) {
    return this.rmaService.findAll(status);
  }

  /**
   * Xem chi tiết yêu cầu
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.rmaService.findOne(id);
  }

  /**
   * Admin xử lý yêu cầu (Duyệt/Hoàn tiền)
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  // @RequirePermissions('rma:update')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReturnStatusDto,
  ) {
    return this.rmaService.updateStatus(id, dto);
  }
}
