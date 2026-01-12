import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Brand } from '@prisma/client';
import { BaseCrudService } from '@/common/base-crud.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

/**
 * =====================================================================
 * BRANDS SERVICE - QUẢN LÝ THƯƠNG HIỆU
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CRUD STANDARDIZATION:
 * - `BrandsService` kế thừa `BaseCrudService` để tái sử dụng các hàm tìm kiếm, phân trang chuẩn.
 *
 * 2. BUSINESS CONSTRAINTS (Ràng buộc nghiệp vụ):
 * - Trước khi tạo mới: Kiểm tra trùng tên thương hiệu (Conflict check).
 * - Trước khi xóa: Phải kiểm tra xem thương hiệu đó có đang chứa sản phẩm nào không. Nếu có -> KHÔNG được xóa để đảm bảo toàn vẹn dữ liệu (Integrity).
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
   * - Kiểm tra trùng lặp tên trong phạm vi Tenant hiện tại.
   * Ví dụ: Apple, Samsung, Nike.
   */
  async create(createBrandDto: CreateBrandDto) {
    // Kiểm tra trùng tên thương hiệu
    const tenant = getTenant();
    const existing = await this.model.findFirst({
      where: {
        name: createBrandDto.name,
        tenantId: tenant?.id,
      },
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
   * - Hỗ trợ tìm kiếm theo tên.
   * - Sắp xếp theo tên A-Z để user dễ chọn trong Dropdown.
   * - Kèm theo số lượng sản phẩm của mỗi Brand (`_count`).
   */
  async findAll(search?: string, page = 1, limit = 10) {
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    // Use usage of Base Service helper
    // NOTE: When using `select`, `include` is ignored by Prisma.
    // So we put _count directly inside select.
    // Use direct Prisma call to avoid potential BaseCrudService complexity for now
    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
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
      const tenant = getTenant();
      const existingName = await this.model.findFirst({
        where: {
          name: updateBrandDto.name,
          tenantId: tenant?.id,
        },
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
   * Xóa thương hiệu (Soft Delete).
   * - Ràng buộc: KHÔNG ĐƯỢC xóa nếu thương hiệu đang gắn với bất kỳ sản phẩm nào.
   * - Mục đích: Tránh làm hỏng dữ liệu sản phẩm (Orphaned products).
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

    return this.softDeleteBase(id);
  }
}
