import { CacheService } from '@core/cache/cache.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Category } from '@prisma/client';
import { createSlug } from '@/common/utils/string';
import { BaseCrudService } from '@/common/base-crud.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * =====================================================================
 * CATEGORIES SERVICE - Dịch vụ quản lý danh mục sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HIERARCHICAL DATA (Dữ liệu phân cấp):
 * - Danh mục sản phẩm thường có cấu trúc cây (Cha - Con). Ví dụ: Điện tử -> Điện thoại -> Smartphone.
 * - `parentId` giúp ta xây dựng mối quan hệ này trong Database.
 *
 * 2. SLUG & SEO:
 * - `slugify` giúp chuyển đổi tên danh mục thành chuỗi không dấu, cách nhau bằng dấu gạch ngang (VD: "Đồ Gia Dụng" -> "do-gia-dung").
 * - Rất quan trọng cho SEO và làm URL trông chuyên nghiệp hơn.
 *
 * 3. AGGREGATION (Tổng hợp dữ liệu):
 * - Hàm `findAll` sử dụng `_count` của Prisma để đếm số lượng sản phẩm trong mỗi danh mục một cách hiệu quả mà không cần load toàn bộ sản phẩm.
 *
 * 4. SAFETY CONSTRAINTS:
 * - Ngăn chặn việc xóa danh mục nếu nó vẫn còn chứa sản phẩm hoặc danh mục con.
 * - Đảm bảo tính nhất quán của dữ liệu (Data Integrity).
 * =====================================================================
 */

@Injectable()
export class CategoriesService extends BaseCrudService<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    super(CategoriesService.name);
  }

  protected get model() {
    return this.prisma.category;
  }

  /**
   * Tạo danh mục mới.
   * - Tự động tạo slug từ tên nếu người dùng không nhập.
   * - Kiểm tra trùng lặp tên hoặc slug (Tránh lỗi Unique Constraint).
   * - Validate danh mục cha (Parent ID) để xây dựng cây phân cấp (Tree Structure).
   */
  async create(createCategoryDto: CreateCategoryDto) {
    // 1. Tạo slug (URL friendly string) từ tên danh mục
    // VD: "Điện thoại Samsung" -> "dien-thoai-samsung"
    const slug = createCategoryDto.slug || createSlug(createCategoryDto.name);

    // 2. Kiểm tra xem danh mục đã tồn tại chưa (check cả tên và slug)
    const tenant = getTenant();
    const existing = await this.model.findFirst({
      where: {
        OR: [{ name: createCategoryDto.name }, { slug }],
        tenantId: tenant?.id,
      },
    });

    if (existing) {
      throw new ConflictException('Danh mục với tên hoặc slug này đã tồn tại');
    }

    // 3. Validate danh mục cha (nếu người dùng truyền lên)
    if (createCategoryDto.parentId) {
      const parent = await this.model.findFirst({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }
    }

    // 4. Lưu vào database
    const newCategory = await this.model.create({
      data: {
        ...createCategoryDto,
        slug,
        tenantId: tenant!.id,
      },
    });

    // Invalidate cache
    await this.cacheService.invalidatePattern('categories:all:*');

    return newCategory;
  }

  /**
   * Lấy danh sách tất cả danh mục.
   * - Trả về danh sách phẳng (Flat List), sắp xếp mới nhất lên đầu.
   * - Caching: Cache kết quả 1 giờ vì danh mục ít khi thay đổi.
   * - Count: Đếm số lượng sản phẩm trong mỗi danh mục.
   */
  async findAll(search?: string, page = 1, limit = 100) {
    const cacheKey = `categories:all:${search || 'none'}:${page}:${limit}`;

    // TTL: 1 hour (Categories change rarely)
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const where = search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { slug: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {};

        // Use BaseCrudService helper
        // NOTE: When using `select`, `include` is ignored by Prisma.
        // So we put _count directly inside select.
        const result = await this.findAllBase(
          page,
          limit,
          where,
          {}, // include - ignored when select is used
          { createdAt: 'desc' },
          {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { products: true },
            },
          },
        );

        // Map count to productCount
        const data = result.data.map((c) => ({
          ...c,
          productCount: (c as any)._count?.products || 0,
        }));

        return {
          ...result,
          data,
        };
      },
      3600,
    );
  }

  /**
   * Lấy chi tiết một danh mục theo ID.
   */
  async findOne(id: string) {
    return this.findOneBase(id);
  }

  /**
   * Cập nhật thông tin danh mục.
   * - Cho phép đổi tên, slug, hoặc di chuyển danh mục cha (Re-parenting).
   * - Logic quan trọng: Nếu đổi slug, bắt buộc phải kiểm tra trùng lặp với các danh mục KHÁC.
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOneBase(id);

    // Nếu có đổi slug, kiểm tra xem slug mới có bị trùng với danh mục KHÁC không
    if (updateCategoryDto.slug) {
      const tenant = getTenant();
      const existingSlug = await this.model.findFirst({
        where: {
          slug: updateCategoryDto.slug,
          tenantId: tenant?.id,
        },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(
          'Slug này đã được sử dụng bởi danh mục khác',
        );
      }
    }

    // Xử lý parentId: chuỗi rỗng → null (để bỏ parent category)
    const dataToUpdate = {
      ...updateCategoryDto,
      // Nếu parentId là chuỗi rỗng, chuyển thành null để Prisma hiểu là bỏ liên kết
      parentId:
        updateCategoryDto.parentId === '' ? null : updateCategoryDto.parentId,
    };

    const updated = await this.model.update({
      where: { id },
      data: dataToUpdate,
    });

    await this.cacheService.invalidatePattern('categories:all:*');

    return updated;
  }

  /**
   * Xóa danh mục (Soft Delete).
   * - RÀNG BUỘC TOÀN VẸN (Integrity Constraints):
   *   1. KHÔNG được xóa nếu danh mục đang chứa sản phẩm -> Yêu cầu user di chuyển sản phẩm trước.
   *   2. KHÔNG được xóa nếu danh mục đang có danh mục con -> Yêu cầu user xử lý cây danh mục trước.
   */
  async remove(id: string) {
    // 1. Check sản phẩm con
    const hasProducts = await this.prisma.product.findFirst({
      where: {
        categories: {
          some: { categoryId: id },
        },
      },
    });
    if (hasProducts) {
      throw new BadRequestException(
        'Không thể xóa danh mục đang chứa sản phẩm. Hãy xóa hoặc di chuyển sản phẩm trước.',
      );
    }

    // 2. Check danh mục con
    const hasChildren = await this.model.findFirst({
      where: { parentId: id },
    });
    if (hasChildren) {
      throw new BadRequestException(
        'Không thể xóa danh mục đang chứa danh mục con.',
      );
    }

    const deleted = await this.softDeleteBase(id);
    await this.cacheService.invalidatePattern('categories:all:*');
    return deleted;
  }
}
