import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiListResponse,
  ApiUpdateResponse,
} from '@/common/decorators/crud.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from '@/identity/auth/interfaces/request-with-user.interface';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

/**
 * =====================================================================
 * ADDRESSES CONTROLLER - Điều hướng yêu cầu về địa chỉ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SECURITY (JWT AUTH):
 * - `@UseGuards(JwtAuthGuard)`: Đảm bảo chỉ những người dùng đã đăng nhập mới có thể truy cập các API này.
 * - `@ApiBearerAuth()`: Thông báo cho Swagger rằng API này yêu cầu Token để thực thi.
 *
 * 2. REQUEST OBJECT:
 * - `@Request() req`: Dùng để lấy thông tin user từ Token (sau khi qua Guard). `req.user.id` giúp ta biết chính xác ai đang thực hiện yêu cầu.
 *
 * 3. RESTFUL API:
 * - Sử dụng đầy đủ các phương thức: `POST` (Tạo), `GET` (Lấy), `PATCH` (Cập nhật), `DELETE` (Xóa). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Cho phép người dùng đầu cuối (Customer) quản lý danh sách địa chỉ nhận hàng của họ một cách an toàn.

 * =====================================================================
 */
@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiCreateResponse('Address', { summary: 'Tạo địa chỉ mới' })
  async create(
    @Request() req: RequestWithUser,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return await this.addressesService.create(req.user.id, createAddressDto);
  }

  @Get()
  @ApiListResponse('Address', { summary: 'Lấy danh sách địa chỉ của user' })
  async findAll(@Request() req: RequestWithUser) {
    return await this.addressesService.findAll(req.user.id);
  }

  @Patch(':id')
  @ApiUpdateResponse('Address', { summary: 'Cập nhật địa chỉ' })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return await this.addressesService.update(
      req.user.id,
      id,
      updateAddressDto,
    );
  }

  @Delete(':id')
  @ApiDeleteResponse('Address', { summary: 'Xóa địa chỉ' })
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return await this.addressesService.remove(req.user.id, id);
  }
}
