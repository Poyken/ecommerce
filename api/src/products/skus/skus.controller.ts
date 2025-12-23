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
 * SKUS CONTROLLER - Điều hướng yêu cầu về biến thể sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FILE UPLOADING (Tải tệp lên):
 * - `@UseInterceptors(FileInterceptor('image'))`: Sử dụng Interceptor để bắt tệp tin gửi lên từ Client (thông qua `multipart/form-data`).
 * - `@UploadedFile()`: Lấy thông tin tệp tin đã tải lên để xử lý (trong trường hợp này là đẩy lên Cloudinary).
 *
 * 2. MULTIPART FORM DATA:
 * - `@ApiConsumes('multipart/form-data')`: Thông báo cho Swagger rằng API này nhận dữ liệu dạng form có kèm tệp tin.
 *
 * 3. BUSINESS LOGIC DELEGATION:
 * - Controller chịu trách nhiệm xử lý tệp tin (Upload ảnh) và sau đó chuyển dữ liệu đã làm sạch (kèm URL ảnh) cho Service xử lý logic nghiệp vụ.
 *
 * 4. ACCESS CONTROL:
 * - Tương tự như Product, các hành động thay đổi SKU đều yêu cầu quyền `product:create`, `product:update`, hoặc `product:delete`.
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
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkusService } from './skus.service';

@ApiTags('Product SKUs')
@Controller('skus')
export class SkusController {
  constructor(
    private readonly skusService: SkusService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tạo SKU mới (Biến thể)' })
  async create(
    @Body() createSkuDto: CreateSkuDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      createSkuDto.imageUrl = result.secure_url;
    }
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
    @Query('search') search?: string,
    @Query('stockLimit') stockLimit?: number,
  ) {
    return this.skusService.findAll(
      Number(page),
      Number(limit),
      status,
      search,
      stockLimit ? Number(stockLimit) : undefined,
    );
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
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật thông tin SKU (Giá, Tồn kho...)' })
  async update(
    @Param('id') id: string,
    @Body() updateSkuDto: UpdateSkuDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      updateSkuDto.imageUrl = result.secure_url;
    }
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
