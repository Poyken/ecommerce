import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto, SortOption } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const { options, ...productData } = createProductDto;

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
      },
      include: {
        options: {
          include: { values: true },
        },
        category: true,
        brand: true,
      },
    });

    // 4. Auto-generate SKUs (Cartesian Product)
    if (product.options && product.options.length > 0) {
      const optionValues = product.options.map((opt) => opt.values);
      const combinations = this.cartesian(optionValues);

      for (const combo of combinations) {
        // combo là mảng các đối tượng OptionValue [ {id:..., value:'Red'}, {id:..., value:'XL'} ]

        // Tạo mã SKU: SLUG-RED-XL
        const variantSuffix = combo
          .map((v) => slugify(v.value, { lower: true }))
          .join('-');
        const skuCode = `${slug}-${variantSuffix}`.toUpperCase();

        // Tạo SKU
        await this.prisma.sku.create({
          data: {
            skuCode,
            productId: product.id,
            price: 0, // Giá mặc định, admin sẽ cập nhật sau
            stock: 0, // Tồn kho mặc định
            status: 'ACTIVE',
            optionValues: {
              create: combo.map((val) => ({
                optionValueId: val.id,
              })),
            },
          },
        });
      }
    } else {
      // Nếu không có tùy chọn, tạo 1 SKU mặc định
      await this.prisma.sku.create({
        data: {
          skuCode: `${slug}-DEFAULT`.toUpperCase(),
          productId: product.id,
          price: 0,
          stock: 0,
          status: 'ACTIVE',
        },
      });
    }

    return product;
  }

  // Hàm hỗ trợ tính toán Tích Đề-các (Cartesian Product)
  private cartesian(args: any[][]): any[][] {
    const r: any[][] = [];
    const max = args.length - 1;
    function helper(arr: any[], i: number) {
      for (let j = 0, l = args[i].length; j < l; j++) {
        const a = arr.slice(0); // sao chép mảng
        a.push(args[i][j]);
        if (i == max) r.push(a);
        else helper(a, i + 1);
      }
    }
    helper([], 0);
    return r;
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
    } = query;

    const skip = (page - 1) * limit;

    // Xây dựng mệnh đề Where
    const where: Prisma.ProductWhereInput = {
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
        // 2. Filter theo Category
        categoryId ? { categoryId } : {},
        // 3. Filter theo Brand
        brandId ? { brandId } : {},
        // 4. Filter theo khoảng giá (Dựa trên SKU)
        minPrice !== undefined || maxPrice !== undefined
          ? {
              skus: {
                some: {
                  price: {
                    gte: minPrice,
                    lte: maxPrice,
                  },
                },
              },
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
          // Lưu ý: Sort theo relation aggregate (min price của skus) cần Prisma previewFeatures hoặc raw query.
          // Tạm thời sort theo tên để tránh lỗi runtime nếu DB chưa support.
          // TODO: Thêm cột 'minPrice' vào bảng Product để hiệu năng tốt hơn & dễ sort.
          orderBy = { name: 'asc' };
          break;
        case SortOption.PRICE_DESC:
          orderBy = { name: 'desc' };
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

          options: {
            select: {
              name: true,
              values: {
                select: { value: true },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },

          // Load 1 SKU giá thấp nhất để hiển thị "Giá từ..." và Ảnh đại diện
          skus: {
            take: 1,
            where: { 
              status: 'ACTIVE',
              price: { gt: 0 }
            },
            orderBy: { price: 'asc' },
            select: {
              price: true,
              salePrice: true,
              imageUrl: true,
              // Không load optionValues ở đây
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
        totalPages: Math.ceil(total / limit),
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
        // Load options để hiển thị bộ lọc (chọn màu, chọn size)
        options: {
          include: { values: true },
          orderBy: { displayOrder: 'asc' },
        },
        // Load SKUs để biết giá và tồn kho của từng biến thể
        skus: {
          include: {
            optionValues: {
              include: { optionValue: { include: { option: true } } },
            },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { options, ...data } = updateProductDto;

    // 1. Cập nhật thông tin cơ bản
    const product = await this.prisma.product.update({
      where: { id },
      data: data,
      include: { options: { include: { values: true } } },
    });

    // 2. Đồng bộ Tùy chọn nếu được cung cấp
    if (options) {
      // A. Xóa các tùy chọn hiện có không nằm trong danh sách mới (theo logic tên hoặc chỉ cần xóa và tạo lại nếu đơn giản)
      // Để đơn giản và chính xác với ID, chúng ta sẽ thực hiện cách tiếp cận "xóa và tạo lại" cho Options
      // NHƯNG để bảo tồn lịch sử SKU, chúng ta phải cẩn thận.
      // Cách tiếp cận tốt hơn:
      // - Xóa tất cả các tùy chọn hiện có (cascade sẽ xóa các giá trị).
      // - Tạo lại các tùy chọn từ đầu vào.
      // - Tạo lại SKU.

      // Cập nhật giao dịch
      await this.prisma.$transaction(async (tx) => {
        // 1. Xóa tùy chọn cũ
        await tx.productOption.deleteMany({ where: { productId: id } });

        // 2. Tạo tùy chọn mới
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
      });
    }

    // 3. Đồng bộ SKU (Sau khi cập nhật Options)
    // Lấy sản phẩm mới với các tùy chọn mới
    const freshProduct = await this.prisma.product.findUnique({
      where: { id },
      include: { options: { include: { values: true } } },
    });

    if (
      freshProduct &&
      freshProduct.options &&
      freshProduct.options.length > 0
    ) {
      const optionValues = freshProduct.options.map((opt) => opt.values);
      const combinations = this.cartesian(optionValues);

      const validSkuCodes = new Set<string>();

      for (const combo of combinations) {
        const variantSuffix = combo
          .map((v) => slugify(v.value, { lower: true }))
          .join('-');
        const skuCode = `${freshProduct.slug}-${variantSuffix}`.toUpperCase();
        validSkuCodes.add(skuCode);

        // Kiểm tra xem SKU có tồn tại không
        const existingSku = await this.prisma.sku.findUnique({
          where: { skuCode },
        });

        if (!existingSku) {
          // Tạo SKU mới
          await this.prisma.sku.create({
            data: {
              skuCode,
              productId: id,
              price: 0,
              stock: 0,
              status: 'ACTIVE',
              optionValues: {
                create: combo.map((val) => ({
                  optionValueId: val.id,
                })),
              },
            },
          });
        } else {
          // Nếu tồn tại, đảm bảo nó đang ACTIVE và có liên kết tùy chọn chính xác (nếu được tạo lại)
          await this.prisma.sku.update({
            where: { id: existingSku.id },
            data: { status: 'ACTIVE' },
          });

          // Liên kết lại các giá trị tùy chọn nếu chúng được tạo lại (ID đã thay đổi)
          // Trước tiên xóa các liên kết cũ
          await this.prisma.skuToOptionValue.deleteMany({
            where: { skuId: existingSku.id },
          });
          // Tạo liên kết mới
          await this.prisma.skuToOptionValue.createMany({
            data: combo.map((val) => ({
              skuId: existingSku.id,
              optionValueId: val.id,
            })),
          });
        }
      }

      // 4. Hủy kích hoạt các SKU không hợp lệ (những SKU không nằm trong các kết hợp mới)
      // Chỉ dành cho sản phẩm này
      await this.prisma.sku.updateMany({
        where: {
          productId: id,
          skuCode: { notIn: Array.from(validSkuCodes) },
        },
        data: { status: 'INACTIVE' },
      });
    } else if (freshProduct) {
      // Nếu không có tùy chọn, đảm bảo SKU mặc định tồn tại
      const defaultSkuCode = `${freshProduct.slug}-DEFAULT`.toUpperCase();
      const existingDefault = await this.prisma.sku.findUnique({
        where: { skuCode: defaultSkuCode },
      });

      if (!existingDefault) {
        await this.prisma.sku.create({
          data: {
            skuCode: defaultSkuCode,
            productId: id,
            price: 0,
            stock: 0,
            status: 'ACTIVE',
          },
        });
      } else {
        await this.prisma.sku.update({
          where: { id: existingDefault.id },
          data: { status: 'ACTIVE' },
        });
      }

      // Hủy kích hoạt tất cả các SKU khác cho sản phẩm này
      await this.prisma.sku.updateMany({
        where: {
          productId: id,
          skuCode: { not: defaultSkuCode },
        },
        data: { status: 'INACTIVE' },
      });
    }

    return freshProduct;
  }

  async remove(id: string) {
    // Prisma setup cascade delete trong Schema, nên xóa Product sẽ xóa luôn Options và SKUs liên quan.
    return this.prisma.product.delete({ where: { id } });
  }
}
