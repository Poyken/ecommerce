import { PrismaService } from '@core/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Brand } from '@prisma/client';
import { BaseCrudService } from '../common/base-crud.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

/**
 * =====================================================================
 * BRANDS SERVICE - Dịch vụ quản lý thương hiệu
 * =====================================================================
 *
 * 📚 UPDATED:
 * - Refactored to use `BaseCrudService` for standardization.
 * - Custom logic (conflict checks, constraints) remains here.
 * =====================================================================
 */

@Injectable()
export class BrandsService extends BaseCrudService<
  Brand,
  CreateBrandDto,
  UpdateBrandDto
> {
  constructor(private readonly prisma: PrismaService) {
    super(BrandsService.name);
  }

  protected get model() {
    return this.prisma.brand;
  }

  /**
   * Tạo thương hiệu mới (Brand).
   * Ví dụ: Apple, Samsung, Nike.
   */
  async create(createBrandDto: CreateBrandDto) {
    // Kiểm tra trùng tên thương hiệu
    const existing = await this.model.findUnique({
      where: { name: createBrandDto.name },
    });

    if (existing) {
      throw new ConflictException('Thương hiệu này đã tồn tại');
    }

    return this.model.create({
      data: createBrandDto,
    });
  }

  /**
   * Lấy danh sách thương hiệu.
   * Sắp xếp theo tên A-Z để dễ tìm kiếm.
   */
  async findAll(search?: string, page = 1, limit = 10) {
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    // Use usage of Base Service helper
    return this.findAllBase(
      page,
      limit,
      where,
      {
        _count: {
          select: { products: true },
        },
      },
      { name: 'asc' }, // Order by Name A-Z
    );
  }

  async findOne(id: string) {
    return this.findOneBase(id);
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    // Ensure exists using base helper or manual check
    // We need logic to check conflict name, so manual check is good.
    const brand = await this.findOneBase(id); // Will throw NotFound if missing

    // Nếu đổi tên, phải check trùng
    if (updateBrandDto.name) {
      const existingName = await this.model.findUnique({
        where: { name: updateBrandDto.name },
      });
      if (existingName && existingName.id !== id) {
        throw new ConflictException('Tên thương hiệu đã được sử dụng');
      }
    }

    return this.model.update({
      where: { id },
      data: updateBrandDto,
    });
  }

  /**
   * Xóa thương hiệu.
   * Ràng buộc: Không được xóa nếu đang có sản phẩm thuộc thương hiệu này.
   */
  async remove(id: string) {
    const hasProducts = await this.prisma.product.findFirst({
      where: { brandId: id },
    });
    if (hasProducts) {
      throw new BadRequestException(
        'Không thể xóa thương hiệu đang có sản phẩm liên kết.',
      );
    }

    return this.model.delete({ where: { id } });
  }
}
