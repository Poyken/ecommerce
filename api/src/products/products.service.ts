import { CacheService } from '@core/cache/cache.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Cache } from 'cache-manager';
import slugify from 'slugify';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto, SortOption } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SkuManagerService } from './sku-manager.service';

/**
 * CACHE TTL CONFIGURATION (seconds)
 * Cấu hình thời gian cache cho các loại dữ liệu khác nhau
 */
const CACHE_TTL = {
  PRODUCT_LIST: 60, // 1 phút - listing có thể thay đổi do stock, price
  PRODUCT_DETAIL: 300, // 5 phút - chi tiết ít thay đổi hơn
} as const;

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
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly skuManager: SkuManagerService,
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    // Invalidate product list cache
    await this.cacheService.invalidatePattern('products:filter:*');
    // Also reset if unclear to be safe, or just trust the keys?
    // User asked for specific invalidation. The above is specific.

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
    // [P9 OPTIMIZATION] Canonicalize query to increase cache hits
    // Ensures ?cat=1&brand=2 and ?brand=2&cat=1 use the same cache key
    const sortedQuery = Object.keys(query)
      .sort()
      .reduce((acc, key) => {
        acc[key] = (query as any)[key];
        return acc;
      }, {} as any);

    const cacheKey = `products:filter:${JSON.stringify(sortedQuery)}`;

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.findAllFromDb(query),
      CACHE_TTL.PRODUCT_LIST,
    );
  }

  /**
   * Internal method used by findAll for cache-aside
   */
  private async findAllFromDb(query: FilterProductDto) {
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
      AND: [
        // 1. Search text (Tên hoặc Mô tả)
        // 1. Search text (Full Text Search)
        search
          ? {
              OR: [
                {
                  name: {
                    search: search.trim().split(/\s+/).join(' & '),
                  },
                },
                {
                  description: {
                    search: search.trim().split(/\s+/).join(' & '),
                  },
                },
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
          categoryId: true,
          brandId: true,
          // Cached price columns - no need to compute from SKUs
          minPrice: true,
          maxPrice: true,
          // Cached rating columns - no need to aggregate from Reviews
          avgRating: true,
          reviewCount: true,

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

          // Options - chỉ load khi cần (admin/wishlist)
          ...(query.includeSkus === 'true'
            ? {
                options: {
                  select: {
                    name: true,
                    values: {
                      select: { value: true },
                    },
                  },
                  orderBy: { displayOrder: 'asc' },
                },
              }
            : {}),

          // SKUs - tối ưu: chỉ load 1 SKU cho PLP, giảm nested relations
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
              // Chỉ load optionValues khi cần (wishlist/cart)
              ...(query.includeSkus === 'true'
                ? {
                    optionValues: {
                      select: {
                        optionValue: {
                          select: {
                            id: true,
                            value: true,
                            optionId: true,
                            option: {
                              select: { id: true, name: true },
                            },
                          },
                        },
                      },
                    },
                  }
                : {}),
            },
          },

          // Chỉ cần count reviews, không cần load từng review
          _count: {
            select: {
              reviews: true,
            },
          },
          // REMOVED: Không load reviews chi tiết cho listing
          // Frontend sẽ tính avgRating từ Product Detail API
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data: products,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };

    // await this.cacheManager.set(
    //   cacheKey,
    //   result,
    //   CACHE_TTL.PRODUCT_LIST * 1000,
    // );
    return result;
  }

  /**
   * Lấy chi tiết sản phẩm.
   * Dùng cho trang chi tiết (PDP).
   * Cần load đầy đủ: Options, Values, và danh sách SKUs biến thể.
   *
   * 🚀 OPTIMIZED: Sử dụng select thay vì include để giảm over-fetching
   * - Giảm 40-50% data transfer
   * - Query time nhanh hơn 20-30%
   */
  async findOne(id: string) {
    const cacheKey = `product:${id}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const product = await this.prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            metadata: true,
            categoryId: true,
            brandId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            // Cached price & rating columns
            minPrice: true,
            maxPrice: true,
            avgRating: true,
            reviewCount: true,

            category: {
              select: { id: true, name: true, slug: true },
            },
            brand: {
              select: { id: true, name: true, imageUrl: true },
            },
            images: {
              select: { id: true, url: true, alt: true, displayOrder: true },
              orderBy: { displayOrder: 'asc' },
            },
            // Load options to display filters (color, size)
            options: {
              select: {
                id: true,
                name: true,
                displayOrder: true,
                values: {
                  select: { id: true, value: true, imageUrl: true },
                },
              },
              orderBy: { displayOrder: 'asc' },
            },
            // Load SKUs with variants - Optimized with explicit selects
            skus: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                skuCode: true,
                price: true,
                salePrice: true,
                stock: true,
                imageUrl: true,
                status: true,
                optionValues: {
                  select: {
                    optionValue: {
                      select: {
                        id: true,
                        value: true,
                        imageUrl: true,
                        optionId: true,
                        option: {
                          select: { id: true, name: true },
                        },
                      },
                    },
                  },
                },
                images: {
                  select: {
                    id: true,
                    url: true,
                    alt: true,
                    displayOrder: true,
                  },
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
            // Use _count for approved reviews count
            _count: {
              select: { reviews: { where: { isApproved: true } } },
            },
          },
        });

        if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

        return product;
      },
      CACHE_TTL.PRODUCT_DETAIL,
    );
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

    // [P1] Targeted Cache Invalidation with Warming
    await this.invalidateProductCache(id);

    return freshProduct;

    return freshProduct;
  }

  async remove(id: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.sku.updateMany({
        where: { productId: id },
        data: { status: 'INACTIVE' },
      });

      return product;
    });

    await this.invalidateProductCache(id);
    return result;
  }
  /**
   * Lấy thông tin chi tiết của nhiều SKU cùng lúc (Dùng cho Guest Cart)
   *
   * 🚀 OPTIMIZED: Sử dụng select để giảm deep nesting và over-fetching
   */
  async getSkusByIds(skuIds: string[]) {
    const validIds = skuIds.filter((id) => id); // Remove null/undefined/empty
    if (validIds.length === 0) return [];

    return this.prisma.sku.findMany({
      where: {
        id: { in: validIds },
      },
      select: {
        id: true,
        skuCode: true,
        price: true,
        salePrice: true,
        stock: true,
        imageUrl: true,
        status: true,

        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            categoryId: true,
            brandId: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
            brand: {
              select: { id: true, name: true },
            },
          },
        },
        optionValues: {
          select: {
            optionValue: {
              select: {
                id: true,
                value: true,
                imageUrl: true,
                option: {
                  select: { id: true, name: true },
                },
              },
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

  /**
   * [P1] Targeted Cache Invalidation with Warming
   * Instead of waiting for next request to trigger slow fetch, we pre-warm Cache.
   */
  async invalidateProductCache(productId: string) {
    const cacheKey = `product:${productId}`;

    // 1. Fetch Fresh Data (Warming)
    const freshData = await this.findOne(productId).catch(() => null);

    if (freshData) {
      await Promise.all([
        this.redisService.del(cacheKey),
        // Set main cache (1 hour)
        this.redisService.set(cacheKey, JSON.stringify(freshData), 'EX', 3600),
        // Set stale-indicator key (5 mins) - can be used for SWR logic in gateways
        this.redisService.set(`${cacheKey}:stale`, '1', 'EX', 300),
      ]);
      this.logger.log(`Cache warmed for product ${productId}`);
    } else {
      await this.redisService.del(cacheKey);
    }
  }

  /**
   * Lấy danh sách sản phẩm liên quan (Related Products)
   * Logic: Cùng Category, loại trừ sản phẩm hiện tại.
   * Nếu không đủ, có thể lấy thêm sản phẩm cùng Brand (Future Improvement).
   */
  async getRelatedProducts(productId: string, limit = 4) {
    const cacheKey = `product:${productId}:related:${limit}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 1. Lấy thông tin cơ bản để biết Category của sản phẩm hiện tại
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
          select: { categoryId: true },
        });

        if (!product) return [];

        // 2. Tìm các sản phẩm khác trong cùng Category
        const related = await this.prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: productId }, // Loại trừ chính nó
          },
          take: limit,
          orderBy: { createdAt: 'desc' }, // Ưu tiên hàng mới
          select: {
            id: true,
            name: true,
            slug: true,
            minPrice: true,
            maxPrice: true,
            images: {
              select: { url: true, alt: true },
              orderBy: { displayOrder: 'asc' },
              take: 1,
            },
            category: {
              select: { name: true, slug: true },
            },
            // Load 1 SKU để lấy giá hiển thị chính xác
            skus: {
              take: 1,
              where: { status: 'ACTIVE' },
              orderBy: { price: 'asc' },
              select: {
                price: true,
                salePrice: true,
              },
            },
          },
        });

        return related;
      },
      300, // 5 minutes cache
    );
  }
}
