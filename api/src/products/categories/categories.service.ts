import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';
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
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo danh mục mới.
   * - Tự động tạo slug từ tên nếu không được cung cấp.
   * - Kiểm tra trùng lặp tên hoặc slug.
   * - Kiểm tra danh mục cha (nếu có) để tạo cây danh mục.
   */
  async create(createCategoryDto: CreateCategoryDto) {
    // 1. Tạo slug (URL friendly string) từ tên danh mục
    // VD: "Điện thoại Samsung" -> "dien-thoai-samsung"
    const slug =
      createCategoryDto.slug ||
      slugify(createCategoryDto.name, { lower: true, strict: true });

    // 2. Kiểm tra xem danh mục đã tồn tại chưa (check cả tên và slug)
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: createCategoryDto.name }, { slug }] },
    });

    if (existing) {
      throw new ConflictException('Danh mục với tên hoặc slug này đã tồn tại');
    }

    // 3. Validate danh mục cha (nếu người dùng truyền lên)
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }
    }

    // 4. Lưu vào database
    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
    });
  }

  /**
   * Lấy danh sách tất cả danh mục.
   * Hiện tại đang lấy flat list (danh sách phẳng), sắp xếp mới nhất lên đầu.
   */
  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((c) => ({
      ...c,
      productCount: c._count.products,
    }));
  }

  /**
   * Lấy chi tiết một danh mục theo ID.
   */
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  /**
   * Cập nhật thông tin danh mục.
   * - Cho phép cập nhật tên, slug, parentId.
   * - Nếu cập nhật slug, phải kiểm tra trùng lặp.
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');

    // Nếu có đổi slug, kiểm tra xem slug mới có bị trùng với danh mục KHÁC không
    if (updateCategoryDto.slug) {
      const existingSlug = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
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

    return this.prisma.category.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  /**
   * Xóa danh mục.
   * - Có kiểm tra ràng buộc dữ liệu (Constraint Check).
   * - KHÔNG cho phép xóa nếu danh mục đang chứa sản phẩm.
   * - KHÔNG cho phép xóa nếu danh mục đang có danh mục con (phải xóa con trước hoặc chuyển cha).
   */
  async remove(id: string) {
    // 1. Check sản phẩm con
    const hasProducts = await this.prisma.product.findFirst({
      where: { categoryId: id },
    });
    if (hasProducts) {
      throw new BadRequestException(
        'Không thể xóa danh mục đang chứa sản phẩm. Hãy xóa hoặc di chuyển sản phẩm trước.',
      );
    }

    // 2. Check danh mục con
    const hasChildren = await this.prisma.category.findFirst({
      where: { parentId: id },
    });
    if (hasChildren) {
      throw new BadRequestException(
        'Không thể xóa danh mục đang chứa danh mục con.',
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
