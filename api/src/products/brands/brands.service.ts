import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

/**
 * =====================================================================
 * BRANDS SERVICE - Dịch vụ quản lý thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA INTEGRITY (Tính toàn vẹn dữ liệu):
 * - Trước khi tạo hoặc cập nhật, ta luôn kiểm tra xem tên thương hiệu đã tồn tại chưa (`ConflictException`).
 * - Điều này ngăn chặn việc dữ liệu bị trùng lặp, gây bối rối cho người dùng.
 *
 * 2. DELETE CONSTRAINTS (Ràng buộc khi xóa):
 * - Hàm `remove` kiểm tra xem thương hiệu có đang chứa sản phẩm nào không.
 * - Nếu có, ta không cho phép xóa (`BadRequestException`) để tránh lỗi "mồ côi" dữ liệu (Sản phẩm không có thương hiệu).
 *
 * 3. SEARCH & SORT:
 * - `findAll` hỗ trợ tìm kiếm theo tên (không phân biệt hoa thường) và luôn trả về danh sách được sắp xếp A-Z.
 * - Giúp trải nghiệm người dùng Admin mượt mà hơn khi danh sách thương hiệu trở nên dài.
 * =====================================================================
 */

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
      include: {
        _count: {
          select: { products: true },
        },
      },
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
