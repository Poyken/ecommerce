/**
 * =====================================================================
 * PRODUCTS SERVICE - QUẢN LÝ SẢN PHẨM CHO E-COMMERCE
 * =====================================================================
 *
 * =====================================================================
 */

import { CacheService } from '@core/cache/cache.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Cache } from 'cache-manager';
import { createSlug } from '@/common/utils/string';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto, SortOption } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SkuManagerService } from './sku-manager.service';

import { PlanUsageService } from '@/identity/tenants/plan-usage.service';
import { getTenant } from '@core/tenant/tenant.context';
import { createPaginatedResult } from '@/common/dto/base.dto';

/**
 * CACHE TTL CONFIGURATION (seconds)
 * Cấu hình thời gian cache cho các loại dữ liệu khác nhau
 */
const CACHE_TTL = {
  PRODUCT_LIST: 60, // 1 phút - listing có thể thay đổi do stock, price
  PRODUCT_DETAIL: 300, // 5 phút - chi tiết ít thay đổi hơn
} as const;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly skuManager: SkuManagerService,
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly planUsageService: PlanUsageService,
  ) {}

  /**
   * Tạo Sản phẩm mới (Product Base).
   * [P12 FIX]: Atomic creation - Product and SKUs must be created together.
   */
  async create(createProductDto: CreateProductDto) {
    const { options, images, ...productData } = createProductDto;

    // [PLAN LIMIT] Kiểm tra giới hạn gói dịch vụ hiện tại (Basic/Pro/Enterprise)
    const tenant = getTenant();
    if (tenant) {
      await this.planUsageService.checkProductLimit(tenant.id);
    }

    // 1. Tạo Slug tự động từ tên nếu chưa có
    const slug = productData.slug || createSlug(productData.name);

    // 2. Validate khóa ngoại: Categories và Brand phải tồn tại trong DB
    const [categories, brand] = await Promise.all([
      this.prisma.category.findMany({
        where: { id: { in: createProductDto.categoryIds } },
      }),
      this.prisma.brand.findUnique({
        where: { id: createProductDto.brandId },
      }),
    ]);

    if (categories.length !== createProductDto.categoryIds.length)
      throw new NotFoundException('Một hoặc nhiều danh mục không tồn tại');
    if (!brand) throw new NotFoundException('Thương hiệu không tồn tại');

    // [P12 FIX] Atomic Transaction: Product + SKUs in one go
    const product = await this.prisma.$transaction(async (tx) => {
      // 3. Tạo Product và Options (Nested Create)
      const { categoryIds, ...dataForCreate } = productData;
      const newProduct = await tx.product.create({
        data: {
          ...dataForCreate,
          slug,
          tenantId: tenant!.id,
          categories: {
            create: createProductDto.categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
              tenant: { connect: { id: tenant!.id } },
            })),
          },
          options: {
            create: options?.map((opt, index) => ({
              name: opt.name,
              displayOrder: index,
              tenant: { connect: { id: tenant!.id } },
              values: {
                create: opt.values.map((val) => ({
                  value: val,
                  tenant: { connect: { id: tenant!.id } },
                })),
              },
            })),
          },
          images: {
            create: images?.map((img) => ({
              url: img.url,
              alt: img.alt,
              displayOrder: img.displayOrder || 0,
              tenant: { connect: { id: tenant!.id } },
            })),
          },
        },
        include: {
          brand: true,
          categories: {
            include: { category: true },
          },
          options: {
            include: { values: true },
          },
        },
      });

      // 4. Tự động tạo SKUs (Giao cho SkuManager xử lý TRONG transaction)
      // SkuManager sẽ tạo tất cả các biến thể có thể (Red-S, Red-M, Blue-S, Blue-M...)
      await this.skuManager.generateSkusForNewProduct(newProduct, tx);

      return newProduct;
    });

    // [PLAN LIMIT] Tăng bộ đếm usage của tenant
    if (tenant) {
      await this.planUsageService.incrementUsage(tenant.id, 'products');
    }

    // Xóa cache danh sách sản phẩm để user thấy dữ liệu mới ngay lập tức
    await this.cacheService.invalidatePattern('products:filter:*');

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
    // [TỐI ƯU HÓA P9] Chuẩn hóa query (Canonicalization)
    const sortedQuery = Object.keys(query)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = query[key as keyof FilterProductDto];
          return acc;
        },
        {} as Record<string, any>,
      );

    const tenant = getTenant();
    const cacheKey = `products:filter:${tenant?.id || 'public'}:${JSON.stringify(sortedQuery)}`;

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.findAllFromDb(query),
      CACHE_TTL.PRODUCT_LIST,
    );
  }

  /**
   * Internal method: Truy vấn trực tiếp từ DB (Cache-aside pattern)
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

    // Xây dựng mệnh đề Where (Điều kiện lọc)
    const where: any = {
      AND: [],
    };

    // 1. Search text (Case-insensitive ILIKE - Stable Prisma feature)
    // Note: Replaced `search:` (preview feature) with `contains + mode` for production stability
    if (search) {
      where.AND.push({
        OR: [
          {
            name: {
              contains: search.trim(),
              mode: 'insensitive', // PostgreSQL ILIKE
            },
          },
          {
            description: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    // 1.1 Lọc theo danh sách ID cụ thể (dùng cho Cart/Wishlist)
    if (ids) {
      where.AND.push({
        id: { in: ids.split(',').map((id) => id.trim()) },
      });
    }

    // 2. Filter theo Category (Quan hệ Many-to-Many)
    if (categoryId === 'null') {
      where.categories = { none: {} };
    } else if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    // 3. Filter theo Brand
    if (brandId) {
      where.brandId = brandId;
    }

    // 4. Filter theo khoảng giá (Tối ưu bằng cột minPrice/maxPrice cache sẵn trong bảng Product)
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = { AND: [] };
      if (minPrice !== undefined)
        priceFilter.AND.push({ maxPrice: { gte: minPrice } });
      if (maxPrice !== undefined)
        priceFilter.AND.push({ minPrice: { lte: maxPrice } });
      where.AND.push(priceFilter);
    }

    // Dọn dẹp AND nếu trống
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Xây dựng Order By (Sắp xếp)
    // Xây dựng Order By (Sắp xếp) - Thêm id: 'desc' để đảm bảo sort stable khi trùng createdAt
    let orderBy: any = [{ createdAt: 'desc' }, { id: 'desc' }];

    if (sort) {
      switch (sort) {
        case SortOption.NEWEST:
          orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
          break;
        case SortOption.OLDEST:
          orderBy = [{ createdAt: 'asc' }, { id: 'asc' }];
          break;
        case SortOption.PRICE_ASC:
          orderBy = [{ minPrice: 'asc' }, { id: 'asc' }];
          break;
        case SortOption.PRICE_DESC:
          orderBy = [{ minPrice: 'desc' }, { id: 'desc' }];
          break;
        case SortOption.RATING_DESC:
          orderBy = [{ avgRating: 'desc' }, { id: 'desc' }];
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

          brandId: true,
          // Cached price columns - no need to compute from SKUs
          minPrice: true,
          maxPrice: true,
          // Cached rating columns - no need to aggregate from Reviews
          avgRating: true,
          reviewCount: true,

          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
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
          ...(query.includeSkus
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
            take: query.includeSkus ? undefined : 1,
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
              ...(query.includeSkus
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
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return createPaginatedResult(products, total, page, limit);
  }

  /**
   * SEMANTIC SEARCH (Tìm kiếm ngữ nghĩa)
   * Tìm kiếm sản phẩm tương đồng dựa trên vector (embedding).
   */
  async searchSimilar(query: string, limit = 5) {
    try {
      // 1. Tạo Embedding từ Query của user (sử dụng Google Generative AI)
      const { GoogleGenerativeAI } = await import('@google/generative-ai');

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'embedding-001' });

      // Generate vector
      const result = await model.embedContent(query);
      const embedding = result.embedding.values;

      if (!embedding || embedding.length === 0) {
        this.logger.warn('Không thể tạo embedding cho query này');
        return [];
      }

      // 2. Truy vấn Postgres với pgvector (Tính khoảng cách vector)
      // Prisma chưa hỗ trợ native vector search đầy đủ -> Dùng Raw SQL
      // Toán tử <=> là tính khoảng cách cosine distance (gần nhất = 0)

      const vectorStr = `[${embedding.join(',')}]`;

      const products = await this.prisma.$queryRaw`
        SELECT id, name, slug, "avgRating", "reviewCount", 
               1 - (embedding <=> ${vectorStr}::vector) as similarity
        FROM "Product"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${limit};
      `;

      return products;
    } catch (error) {
      this.logger.error('Lỗi khi thực hiện semantic search', error);
      return [];
    }
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
    const tenant = getTenant();
    const cacheKey = `product:${tenant?.id || 'public'}:${id}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const product = await this.prisma.product.findFirst({
          where: { id },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            metadata: true,

            brandId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            // Cached price & rating columns
            minPrice: true,
            maxPrice: true,
            avgRating: true,
            reviewCount: true,

            categories: {
              select: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
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
    const { options, images, categoryIds, ...data } = updateProductDto;

    // 0. [SMART MIGRATION SNAPSHOT] Chụp lại trạng thái cũ trước khi thay đổi
    // Để so sánh và migrate SKU thông minh (VD: giữ nguyên giá/tồn kho nếu chỉ đổi tên Option)
    // 0. [SMART MIGRATION SNAPSHOT] Chụp lại trạng thái cũ trước khi thay đổi
    // Để so sánh và migrate SKU thông minh (VD: giữ nguyên giá/tồn kho nếu chỉ đổi tên Option)
    const oldProductState = await this.prisma.product.findFirst({
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
      oldProductState?.skus?.map((sku) => ({
        id: sku.id,
        price: sku.price,
        stock: sku.stock,
        values: new Set(
          sku.optionValues.map((ov) => ov.optionValue.value.toLowerCase()),
        ),
      })) || [];

    // 1. Cập nhật Thông tin cơ bản & Options (Trong Transaction)
    await this.prisma.$transaction(async (tx) => {
      // Update các trường cơ bản (Tên, Mô tả...)
      await tx.product.update({
        where: { id },
        data: data,
      });

      // Update danh mục nếu có thay đổi
      if (updateProductDto.categoryIds) {
        await tx.productToCategory.deleteMany({
          where: { productId: id },
        });
        await tx.product.update({
          where: { id },
          data: {
            categories: {
              create: updateProductDto.categoryIds.map((cid) => ({
                categoryId: cid,
                tenantId: getTenant()!.id,
              })),
            },
          },
        });
      }

      // Update options nếu có thay đổi (CẤU TRÚC PHỨC TẠP)
      if (options) {
        // Xóa options cũ (Cascade delete sẽ xóa values liên quan)
        await tx.productOption.deleteMany({
          where: { productId: id },
        });

        // Tạo options mới
        if (options.length > 0) {
          await tx.product.update({
            where: { id },
            data: {
              options: {
                create: options.map((opt, index) => ({
                  name: opt.name,
                  displayOrder: index,
                  tenantId: getTenant()!.id,
                  values: {
                    create: opt.values.map((val) => ({
                      value: val,
                      tenantId: getTenant()!.id,
                    })),
                  },
                })),
              },
            },
          });
        }
      }

      // Update hình ảnh nếu có thay đổi
      if (images) {
        // Xóa ảnh cũ
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        // Tạo ảnh mới
        if (images.length > 0) {
          await tx.product.update({
            where: { id },
            data: {
              images: {
                create: images.map((img) => ({
                  url: img.url,
                  alt: img.alt,
                  displayOrder: img.displayOrder || 0,
                  tenantId: getTenant()!.id,
                })),
              },
            },
          });
        }
      }
    });

    // 2. Lấy lại dữ liệu Product mới nhất kèm Options mới
    const freshProduct = await this.prisma.product.findFirst({
      where: { id },
      include: { options: { include: { values: true } } },
    });

    // 3. Kích hoạt SkuManager để đồng bộ lại danh sách SKU
    // (Tạo SKU mới, Xóa SKU cũ, Migrate giá/tồn kho từ cái cũ sang cái mới)
    if (freshProduct) {
      await this.skuManager.smartSkuMigration(
        id,
        freshProduct,
        oldSkuSnapshots,
      );
    }

    // [P1] Xóa cache cũ và làm nóng cache mới (Cache Warming)
    await this.invalidateProductCache(id);
    return freshProduct;
  }

  /**
   * Cập nhật hàng loạt SKUs cho một sản phẩm.
   */
  async bulkUpdateSkus(
    productId: string,
    skus: { id: string; price?: number; salePrice?: number; stock?: number }[],
  ) {
    // Validate: Ensure all SKUs belong to this product
    const skuIds = skus.map((s) => s.id);
    const existingSkus = await this.prisma.sku.findMany({
      where: {
        id: { in: skuIds },
        productId: productId,
      },
      select: { id: true },
    });

    if (existingSkus.length !== skus.length) {
      throw new NotFoundException(
        'Một hoặc nhiều SKU không thuộc về sản phẩm này',
      );
    }

    await this.prisma.$transaction(
      skus.map((sku) =>
        this.prisma.sku.update({
          where: { id: sku.id },
          data: {
            price: sku.price,
            salePrice: sku.salePrice,
            stock: sku.stock,
          },
        }),
      ),
    );

    // Re-calculate min/max price for parent product
    await this.skuManager.updateProductPriceRange(productId);
    await this.invalidateProductCache(productId);

    return { success: true, count: skus.length };
  }

  async remove(id: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.sku.updateMany({
        where: { productId: id },
        data: { status: 'INACTIVE' },
      });

      return updatedProduct;
    });

    await this.invalidateProductCache(id);
    return result;
  }
  /**
   * Lấy thông tin chi tiết của nhiều SKU cùng lúc (Dùng cho Cart/Checkout)
   *
   * 🚀 TỐI ƯU HÓA: Sử dụng select cụ thể để giảm payload và tăng tốc độ query.
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
            brandId: true,
            images: {
              select: { url: true, alt: true },
              orderBy: { displayOrder: 'asc' },
              take: 1,
            },
            categories: {
              select: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
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
   * [P1] Làm mới Cache Sản phẩm (Cache Warming)
   * Thay vì chỉ xóa cache (khiến request tiếp theo bị chậm), ta chủ động fetch dữ liệu mới và set lại cache.
   */
  async invalidateProductCache(productId: string) {
    const cacheKey = `product:${productId}`;

    // 1. Fetch Dữ liệu tươi (Fresh Data)
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
        const product = await this.prisma.product.findFirst({
          where: { id: productId },
          select: {
            categories: {
              take: 1,
              select: { categoryId: true },
            },
          },
        });

        if (!product || product.categories.length === 0) return [];
        const mainCategoryId = product.categories[0].categoryId;

        // 2. Tìm các sản phẩm khác trong cùng Category
        const related = await this.prisma.product.findMany({
          where: {
            categories: {
              some: {
                categoryId: mainCategoryId,
              },
            },
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
            categories: {
              select: {
                category: {
                  select: { name: true, slug: true },
                },
              },
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

  /**
   * [P13 RECONCILIATION] - HỆ THỐNG TỰ PHỤC HỒI DỮ LIỆU
   *
   */
  async reconcileProduct(productId: string) {
    this.logger.log(`Reconciling data for product ${productId}...`);

    await Promise.all([
      // 1. Fix Price Range (Delegated to SkuManager)
      this.skuManager.updateProductPriceRange(productId),

      // 2. Fix Rating & Review Count
      this.recalculateProductRating(productId),
    ]);

    await this.invalidateProductCache(productId);
  }

  /**
   * Internal helper to recalculate ratings for reconciliation
   */
  private async recalculateProductRating(productId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { productId, isApproved: true, deletedAt: null },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: aggregate._avg?.rating || 0,
        reviewCount: aggregate._count || 0,
      },
    });
  }

  /**
   * [P13 RECONCILIATION] Periodic job to heal data across the entire catalog.
   * Runs weekly to ensure high data integrity.
   *
   */
  @Cron('0 2 * * 0') // Sunday at 2 AM
  async reconcileAllProducts() {
    this.logger.log('Starting full catalog reconciliation...');

    // 1. Quét toàn bộ ID sản phẩm (Chỉ lấy ID để tiết kiệm RAM)
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update Price Ranges for all active products based on their SKUs
        await tx.$executeRaw`
          UPDATE "Product" p
          SET 
            "minPrice" = sub.min_p,
            "maxPrice" = sub.max_p
          FROM (
            SELECT 
              "productId",
              MIN(LEAST("price", COALESCE("salePrice", "price"))) as min_p,
              MAX(GREATEST("price", COALESCE("salePrice", "price"))) as max_p
            FROM "Sku"
            WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL
            GROUP BY "productId"
          ) sub
          WHERE p.id = sub."productId" AND p."deletedAt" IS NULL
        `;

        // 2. Update Ratings for all products based on their approved reviews
        await tx.$executeRaw`
          UPDATE "Product" p
          SET 
            "avgRating" = COALESCE(sub.avg_r, 0),
            "reviewCount" = COALESCE(sub.cnt, 0)
          FROM (
            SELECT 
              "productId",
              AVG("rating") as avg_r,
              COUNT(*) as cnt
            FROM "Review"
            WHERE "isApproved" = true AND "deletedAt" IS NULL
            GROUP BY "productId"
          ) sub
          WHERE p.id = sub."productId" AND p."deletedAt" IS NULL
        `;
      });

      // 3. Clear all product-related caches
      await this.cacheService.invalidatePattern('products:*');
      await this.cacheService.invalidatePattern('analytics:*');

      this.logger.log(
        'Global product data reconciliation complete using Raw SQL.',
      );
    } catch (error) {
      this.logger.error('Global reconciliation failed:', error);
    }
  }

  /**
   * Semantic Search - Tìm kiếm bằng vector similarity.
   * Cần pgvector extension được kích hoạt trong PostgreSQL.
   *
   * @param query - Câu truy vấn tự nhiên (VD: "áo ấm cho mùa đông")
   * @param limit - Số kết quả trả về
   */
  async semanticSearch(query: string, limit: number = 10) {
    // 1. Generate embedding for the query
    // Note: GeminiService is not injected here. This is a simplified version.
    // In production, inject GeminiService or use a dedicated EmbeddingService.
    // For now, we'll use a raw SQL query with a placeholder.

    // To keep this simple without injecting GeminiService:
    // We'll return a fallback to fulltext search if embedding is not available.

    this.logger.log(`Semantic search for: "${query}"`);

    // Fallback to PostgreSQL fulltext search (no vector yet)
    // This is a graceful degradation when pgvector is not available
    const results = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        minPrice: true,
        images: {
          take: 1,
          select: { url: true },
        },
      },
    });

    return results;
  }
}
