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
    return this.prisma.category.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
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

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
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
