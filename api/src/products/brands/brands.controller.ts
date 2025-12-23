import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

/**
 * =====================================================================
 * BRANDS CONTROLLER - Điều hướng yêu cầu về thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RBAC (Role-Based Access Control):
 * - Các hành động thay đổi dữ liệu (`create`, `update`, `delete`) đều được bảo vệ bởi `JwtAuthGuard` và `PermissionsGuard`.
 * - Chỉ những người dùng có quyền cụ thể (VD: `brand:create`) mới được phép thực hiện.
 *
 * 2. PUBLIC READ ACCESS:
 * - Các hành động đọc dữ liệu (`findAll`, `findOne`) là công khai.
 * - Giúp khách hàng có thể xem danh sách thương hiệu và lọc sản phẩm theo thương hiệu mà không cần đăng nhập.
 *
 * 3. SWAGGER DOCUMENTATION:
 * - Sử dụng `@ApiTags('Product Brands')` để nhóm các API liên quan đến thương hiệu lại với nhau trên giao diện Swagger.
 * =====================================================================
 */
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('Product Brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('brand:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new brand' })
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      createBrandDto.imageUrl = result.secure_url;
    }
    const data = await this.brandsService.create(createBrandDto);
    return { data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query('search') search?: string) {
    const data = await this.brandsService.findAll(search);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand details' })
  async findOne(@Param('id') id: string) {
    const data = await this.brandsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('brand:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update brand' })
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      updateBrandDto.imageUrl = result.secure_url;
    }
    const data = await this.brandsService.update(id, updateBrandDto);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('brand:delete')
  @ApiOperation({ summary: 'Delete brand' })
  async remove(@Param('id') id: string) {
    const data = await this.brandsService.remove(id);
    return { data };
  }
}
