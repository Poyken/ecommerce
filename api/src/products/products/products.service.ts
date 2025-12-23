import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto, SortOption } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SkuManagerService } from './sku-manager.service';

/**
 * =====================================================================
 * PRODUCTS SERVICE - Trái tim của hệ thống quản lý hàng hóa
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PRODUCT VS SKU ARCHITECTURE:
 * - `Product`: Là thông tin chung (Tên, Mô tả, Danh mục). Ví dụ: "iPhone 15 Pro Max".
 * - `SKU` (Stock Keeping Unit): Là biến thể cụ thể có giá và tồn kho. Ví dụ: "iPhone 15 Pro Max - Màu Titan - 256GB".
 * - Hệ thống tách biệt hai thực thể này để quản lý linh hoạt các sản phẩm có nhiều thuộc tính.
 *
 * 2. SLUG GENERATION:
 * - `slugify`: Tự động tạo đường dẫn thân thiện (SEO-friendly) từ tên sản phẩm.
 * - Thêm `Date.now()` vào cuối slug để đảm bảo tính duy nhất (Unique), tránh lỗi trùng lặp khi có 2 sản phẩm cùng tên.
 *
 * 3. COMPLEX FILTERING:
 * - Hàm `findAll` xử lý logic tìm kiếm đa điều kiện: Search text, Category, Brand, và đặc biệt là khoảng giá (Price Range) dựa trên các SKU liên quan.
 *
 * 4. SMART SKU MIGRATION:
 * - Khi Admin cập nhật Options (VD: thêm màu mới), `SkuManagerService` sẽ tự động tính toán để tạo thêm SKU mới hoặc vô hiệu hóa SKU cũ mà không làm mất dữ liệu tồn kho hiện có.
 *
 * 5. SOFT DELETE:
 * - Thay vì xóa vĩnh viễn khỏi Database, ta dùng `deletedAt` để ẩn sản phẩm. Điều này giúp bảo toàn lịch sử đơn hàng và cho phép khôi phục nếu cần.
 * =====================================================================
 */

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skuManager: SkuManagerService,
  ) {}

  /**
   * Tạo Sản phẩm mới (Product Base).
   *
   * Lưu ý quan trọng:
   * Sản phẩm ở đây đóng vai trò là "Sản phẩm gốc" (Parent Product).
   * Ví dụ: "iPhone 15 Pro Max".
   * Nó chứa định nghĩa các tùy chọn (Options) như "Màu sắc", "Dung lượng".
   * Nhưng nó CHƯA phải là một mặt hàng cụ thể có giá và tồn kho (đó là SKU).
   */
  async create(createProductDto: CreateProductDto) {
    const { options, images, ...productData } = createProductDto;

    // 1. Tạo Slug tự động từ tên
    const slug =
      productData.slug ||
      slugify(productData.name, { lower: true, strict: true }) +
        '-' +
        Date.now();

    // 2. Validate khóa ngoại: Category và Brand phải tồn tại
    const [category, brand] = await Promise.all([
      this.prisma.category.findUnique({
        where: { id: productData.categoryId },
      }),
      this.prisma.brand.findUnique({ where: { id: productData.brandId } }),
    ]);

    if (!category) throw new NotFoundException('Danh mục không tồn tại');
    if (!brand) throw new NotFoundException('Thương hiệu không tồn tại');

    // 3. Tạo Product và Options
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        options: {
          create: options?.map((opt, index) => ({
            name: opt.name,
            displayOrder: index,
            values: {
              create: opt.values.map((val) => ({ value: val })),
            },
          })),
        },
        images: {
          create: images?.map((img) => ({
            url: img.url,
            alt: img.alt,
            displayOrder: img.displayOrder || 0,
          })),
        },
      },
      include: {
        options: {
          include: { values: true },
        },
        category: true,
        brand: true,
      },
    });

    // 4. Auto-generate SKUs (Delegated to SkuManager)
    await this.skuManager.generateSkusForNewProduct(product);

    return product;
  }

  /**
   * Lấy danh sách sản phẩm (Phân trang).
   * Dùng cho trang danh sách sản phẩm (PLP).
   */
  /**
   * Lấy danh sách sản phẩm với bộ lọc nâng cao (Search, Filter, Sort, Pagination).
   */
  async findAll(query: FilterProductDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      sort,
      ids,
    } = query;

    const skip = (page - 1) * limit;

    // Xây dựng mệnh đề Where
    const where: Prisma.ProductWhereInput = {
      deletedAt: null, // Chỉ lấy sản phẩm chưa bị xóa
      AND: [
        // 1. Search text (Tên hoặc Mô tả)
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        // 1.1 Filter by IDs
        ids
          ? {
              id: { in: ids.split(',').map((id) => id.trim()) },
            }
          : {},
        // 2. Filter theo Category
        categoryId ? { categoryId } : {},
        // 3. Filter theo Brand
        brandId ? { brandId } : {},
        // 4. Filter theo khoảng giá (Optimized with cached columns)
        minPrice !== undefined || maxPrice !== undefined
          ? {
              AND: [
                minPrice !== undefined ? { maxPrice: { gte: minPrice } } : {},
                maxPrice !== undefined ? { minPrice: { lte: maxPrice } } : {},
              ],
            }
          : {},
      ],
    };

    // Xây dựng Order By
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }; // Mặc định: Mới nhất

    if (sort) {
      switch (sort) {
        case SortOption.NEWEST:
          orderBy = { createdAt: 'desc' };
          break;
        case SortOption.OLDEST:
          orderBy = { createdAt: 'asc' };
          break;
        case SortOption.PRICE_ASC:
          orderBy = { minPrice: 'asc' };
          break;
        case SortOption.PRICE_DESC:
          orderBy = { minPrice: 'desc' }; // Or maxPrice desc? Usually minPrice is clearer for users.
          break;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          categoryId: true, // Cần cho giá trị mặc định form sửa
          brandId: true, // Cần cho giá trị mặc định form sửa

          category: {
            select: { id: true, name: true, slug: true },
          },
          brand: {
            select: { id: true, name: true },
          },
          images: {
            select: { url: true, alt: true },
            orderBy: { displayOrder: 'asc' },
            take: 1,
          },

          options: {
            select: {
              name: true,
              values: {
                select: { value: true },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },

          // Load SKUs - For PLP we usually only need 1 (the lowest price).
          // For Wishlist or other detailed views, we load all via includeSkus=true.
          skus: {
            take: query.includeSkus === 'true' ? undefined : 1,
            where: {
              status: 'ACTIVE',
            },
            orderBy: { price: 'asc' },
            select: {
              id: true,
              price: true,
              salePrice: true,
              imageUrl: true,
              stock: true,
              optionValues: {
                include: {
                  optionValue: {
                    include: {
                      option: true,
                    },
                  },
                },
              },
            },
          },

          _count: {
            select: {
              reviews: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy chi tiết sản phẩm.
   * Dùng cho trang chi tiết (PDP).
   * Cần load đầy đủ: Options, Values, và danh sách SKUs biến thể.
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        // Load options để hiển thị bộ lọc (chọn màu, chọn size)
        options: {
          include: { values: true },
          orderBy: { displayOrder: 'asc' },
        },
        // Load SKUs để biết giá và tồn kho của từng biến thể
        skus: {
          where: { status: 'ACTIVE' },
          include: {
            optionValues: {
              include: { optionValue: { include: { option: true } } },
            },
          },
        },
      },
    });

    if (!product || product.deletedAt)
      throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { options, images, ...data } = updateProductDto;

    // 0. [SMART MIGRATION SNAPSHOT] Capture old state before changes
    const oldProductState = await this.prisma.product.findUnique({
      where: { id },
      include: {
        skus: {
          where: { status: 'ACTIVE' },
          include: {
            optionValues: {
              include: { optionValue: true },
            },
          },
        },
      },
    });

    const oldSkuSnapshots =
      oldProductState?.skus.map((sku) => ({
        id: sku.id,
        price: sku.price,
        stock: sku.stock,
        values: new Set(
          sku.optionValues.map((ov) => ov.optionValue.value.toLowerCase()),
        ),
      })) || [];

    // 1. Update Basic Info & Options (Transaction)
    await this.prisma.$transaction(async (tx) => {
      // Update basic fields
      await tx.product.update({
        where: { id },
        data: data,
      });

      // Update options if provided
      if (options) {
        // Delete old options (cascade deletes values)
        await tx.productOption.deleteMany({ where: { productId: id } });

        // Create new options
        if (options.length > 0) {
          await tx.product.update({
            where: { id },
            data: {
              options: {
                create: options.map((opt, index) => ({
                  name: opt.name,
                  displayOrder: index,
                  values: {
                    create: opt.values.map((val) => ({ value: val })),
                  },
                })),
              },
            },
          });
        }
      }

      // Update images if provided
      if (images) {
        // Delete old images
        await tx.productImage.deleteMany({ where: { productId: id } });

        // Create new images
        if (images.length > 0) {
          await tx.product.update({
            where: { id },
            data: {
              images: {
                create: images.map((img) => ({
                  url: img.url,
                  alt: img.alt,
                  displayOrder: img.displayOrder || 0,
                })),
              },
            },
          });
        }
      }
    });

    // 2. Fetch fresh product state with new options
    const freshProduct = await this.prisma.product.findUnique({
      where: { id },
      include: { options: { include: { values: true } } },
    });

    // 3. Delegate SKU Sync/Migration to Manager
    if (freshProduct) {
      await this.skuManager.smartSkuMigration(
        id,
        freshProduct,
        oldSkuSnapshots,
      );
    }

    return freshProduct;
  }

  async remove(id: string) {
    // Soft delete: Cập nhật deletedAt thay vì xóa vĩnh viễn
    // Đồng thời hủy kích hoạt tất cả SKU liên quan
    return await this.prisma.$transaction(async (tx) => {
      // 1. Soft delete Product
      const product = await tx.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // 2. Deactivate all SKUs
      await tx.sku.updateMany({
        where: { productId: id },
        data: { status: 'INACTIVE' },
      });

      return product;
    });
  }
  /**
   * Lấy thông tin chi tiết của nhiều SKU cùng lúc (Dùng cho Guest Cart)
   */
  async getSkusByIds(skuIds: string[]) {
    const validIds = skuIds.filter((id) => id); // Remove null/undefined/empty
    if (validIds.length === 0) return [];

    return this.prisma.sku.findMany({
      where: {
        id: { in: validIds },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
    });
  }
  async getTranslations(productId: string) {
    return this.prisma.productTranslation.findMany({
      where: { productId },
    });
  }

  async translate(
    productId: string,
    data: { locale: string; name: string; description?: string },
  ) {
    const { locale, name, description } = data;

    return this.prisma.productTranslation.upsert({
      where: {
        productId_locale: {
          productId,
          locale,
        },
      },
      update: {
        name,
        description,
      },
      create: {
        productId,
        locale,
        name,
        description,
      },
    });
  }
}
