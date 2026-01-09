import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  Cached,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import { CloudinaryService } from '@integrations/cloudinary/cloudinary.service';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
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
  @RequirePermissions('brand:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Brand', { summary: 'Create new brand' })
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
  @Cached(300) // Cache 5 phút (300s)
  @ApiListResponse('Brand', { summary: 'Get all brands (cached 5 mins)' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.brandsService.findAll(search, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiGetOneResponse('Brand', { summary: 'Get brand details' })
  async findOne(@Param('id') id: string) {
    const data = await this.brandsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiUpdateResponse('Brand', { summary: 'Update brand' })
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
  @RequirePermissions('brand:delete')
  @ApiDeleteResponse('Brand', { summary: 'Delete brand' })
  async remove(@Param('id') id: string) {
    const data = await this.brandsService.remove(id);
    return { data };
  }
}
