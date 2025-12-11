import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo thương hiệu mới (Brand).
   * Ví dụ: Apple, Samsung, Nike.
   */
  async create(createBrandDto: CreateBrandDto) {
    // Kiểm tra trùng tên thương hiệu
    const existing = await this.prisma.brand.findUnique({
      where: { name: createBrandDto.name },
    });

    if (existing) {
      throw new ConflictException('Thương hiệu này đã tồn tại');
    }

    return this.prisma.brand.create({
      data: createBrandDto,
    });
  }

  /**
   * Lấy danh sách thương hiệu.
   * Sắp xếp theo tên A-Z để dễ tìm kiếm.
   */
  async findAll(search?: string) {
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};
    return this.prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Không tìm thấy thương hiệu');
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Không tìm thấy thương hiệu');

    // Nếu đổi tên, phải check trùng
    if (updateBrandDto.name) {
      const existingName = await this.prisma.brand.findUnique({
        where: { name: updateBrandDto.name },
      });
      if (existingName && existingName.id !== id) {
        throw new ConflictException('Tên thương hiệu đã được sử dụng');
      }
    }

    return this.prisma.brand.update({
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

    return this.prisma.brand.delete({ where: { id } });
  }
}
