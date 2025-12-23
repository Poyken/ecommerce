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
 * - Sử dụng đầy đủ các phương thức: `POST` (Tạo), `GET` (Lấy), `PATCH` (Cập nhật), `DELETE` (Xóa).
 * =====================================================================
 */
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo địa chỉ mới' })
  create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(req.user.id, createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách địa chỉ của user' })
  findAll(@Request() req) {
    return this.addressesService.findAll(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật địa chỉ' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(req.user.id, id, updateAddressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa địa chỉ' })
  remove(@Request() req, @Param('id') id: string) {
    return this.addressesService.remove(req.user.id, id);
  }
}
