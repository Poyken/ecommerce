import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkusService } from './skus.service';

@ApiTags('Product SKUs')
@Controller('skus')
export class SkusController {
  constructor(private readonly skusService: SkusService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:create') // Giả sử việc tạo SKU là một phần của quyền quản lý sản phẩm
  @ApiOperation({ summary: 'Tạo SKU mới (Biến thể)' })
  create(@Body() createSkuDto: CreateSkuDto) {
    return this.skusService.create(createSkuDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách SKU' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
  })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
  ) {
    return this.skusService.findAll(Number(page), Number(limit), status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết SKU' })
  findOne(@Param('id') id: string) {
    return this.skusService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:update')
  @ApiOperation({ summary: 'Cập nhật thông tin SKU (Giá, Tồn kho...)' })
  update(@Param('id') id: string, @Body() updateSkuDto: UpdateSkuDto) {
    return this.skusService.update(id, updateSkuDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:delete')
  @ApiOperation({ summary: 'Xóa SKU' })
  remove(@Param('id') id: string) {
    return this.skusService.remove(id);
  }
}
