import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { OptionValue, Product, ProductOption } from '@prisma/client';
import slugify from 'slugify';

/**
 * =====================================================================
 * SKU MANAGER SERVICE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * SKU (Stock Keeping Unit) là mã định danh duy nhất cho một biến thể sản phẩm cụ thể.
 *
 * VÍ DỤ THỰC TẾ:
 * - Sản phẩm: "iPhone 15 Pro Max"
 * - Options: Màu sắc (Đen, Trắng), Dung lượng (256GB, 512GB)
 * - SKUs được tạo tự động:
 *   1. IPHONE-15-PRO-MAX-DEN-256GB (Đen + 256GB)
 *   2. IPHONE-15-PRO-MAX-DEN-512GB (Đen + 512GB)
 *   3. IPHONE-15-PRO-MAX-TRANG-256GB (Trắng + 256GB)
 *   4. IPHONE-15-PRO-MAX-TRANG-512GB (Trắng + 512GB)
 *
 * Mỗi SKU có giá và tồn kho riêng biệt.
 *
 * Service này xử lý việc tự động sinh SKUs khi tạo/cập nhật sản phẩm.
 * =====================================================================
 */
@Injectable()
export class SkuManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính tích Descartes (Cartesian Product) của các mảng giá trị option.
   *
   * 📚 GIẢI THÍCH THUẬT TOÁN:
   * Tích Descartes tạo ra tất cả tổ hợp có thể từ các tập hợp.
   *
   * @example
   * Input:  [[Đỏ, Xanh], [S, M]]
   * Output: [[Đỏ, S], [Đỏ, M], [Xanh, S], [Xanh, M]]
   *
   * Đây là cách chúng ta tạo tất cả biến thể sản phẩm từ các options.
   *
   * @param args - Mảng chứa các mảng giá trị option
   * @returns Mảng các tổ hợp
   */
  cartesian(args: any[][]): any[][] {
    const r: any[][] = [];
    const max = args.length - 1;

    /**
     * Hàm đệ quy để xây dựng từng tổ hợp.
     * Duyệt qua từng option và thêm giá trị vào mảng tạm.
     */
    function helper(arr: any[], i: number) {
      for (let j = 0, l = args[i].length; j < l; j++) {
        const a = arr.slice(0); // Clone mảng hiện tại
        a.push(args[i][j]); // Thêm giá trị option hiện tại
        if (i == max)
          r.push(a); // Nếu là option cuối cùng, lưu tổ hợp
        else helper(a, i + 1); // Nếu không, tiếp tục với option tiếp theo
      }
    }
    helper([], 0);
    return r;
  }

  /**
   * Tạo mã SKU duy nhất dựa trên slug sản phẩm và các giá trị biến thể.
   *
   * @example
   * Input:  productSlug = "iphone-15", variantValues = [{value: "Đỏ"}, {value: "256GB"}]
   * Output: "IPHONE-15-DO-256GB"
   *
   * @param productSlug - Slug của sản phẩm (url-friendly name)
   * @param variantValues - Các giá trị option của biến thể
   * @returns Mã SKU viết hoa
   */
  generateSkuCode(
    productSlug: string,
    variantValues: { value: string }[],
  ): string {
    // Tạo chuỗi hậu tố từ các giá trị biến thể (slug hóa để URL-safe)
    const variantSuffix = variantValues
      .map((v) => slugify(v.value, { lower: true }))
      .join('-');
    return `${productSlug}-${variantSuffix}`.toUpperCase();
  }

  /**
   * Tự động sinh tất cả SKUs cho sản phẩm mới tạo.
   *
   * 📚 LOGIC:
   * 1. Nếu có options → Tính tích Descartes để lấy tất cả tổ hợp → Tạo SKU cho mỗi tổ hợp
   * 2. Nếu không có options → Tạo 1 SKU mặc định (VD: "IPHONE-15-DEFAULT")
   *
   * ⚠️ LƯU Ý: SKUs mới tạo có price = 0 và stock = 0. Admin cần cập nhật sau.
   *
   * @param product - Sản phẩm vừa tạo (bao gồm options và values)
   */
  /**
   * Cập nhật khoảng giá (minPrice - maxPrice) cho Product cha.
   * Được gọi sau khi có bất kỳ thay đổi nào về SKU (Thêm/Sửa/Xóa).
   */
  async updateProductPriceRange(productId: string) {
    // [P10 OPTIMIZATION] Use DB aggregate for much better performance than in-memory Math.min/max
    const aggregate = await this.prisma.sku.aggregate({
      where: {
        productId,
        status: 'ACTIVE',
      },
      _min: {
        price: true,
        salePrice: true,
      },
      _max: {
        price: true,
        salePrice: true,
      },
    });

    if (!aggregate._min.price && !aggregate._min.salePrice) {
      // No active SKUs
      await this.prisma.product.update({
        where: { id: productId },
        data: { minPrice: null, maxPrice: null },
      });
      return;
    }

    // Min price is the minimum of (min of price) and (min of salePrice if > 0)
    const minP = Number(aggregate._min.price || 0);
    const minS = aggregate._min.salePrice
      ? Number(aggregate._min.salePrice)
      : minP;
    const finalMin = minS > 0 && minS < minP ? minS : minP;

    // Max price is the maximum of (max of price) and (max of salePrice)
    const maxP = Number(aggregate._max.price || 0);
    const maxS = Number(aggregate._max.salePrice || 0);
    const finalMax = Math.max(maxP, maxS);

    // 3. Update lại Product
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        minPrice: finalMin,
        maxPrice: finalMax,
      },
    });
  }

  /**
   * Tự động sinh tất cả SKUs cho sản phẩm mới tạo.
   */
  async generateSkusForNewProduct(
    product: Product & {
      options: (ProductOption & { values: OptionValue[] })[];
    },
  ) {
    if (product.options && product.options.length > 0) {
      const optionValues = product.options.map((opt) => opt.values);
      const combinations = this.cartesian(optionValues);

      await Promise.all(
        combinations.map((combo) => {
          const skuCode = this.generateSkuCode(product.slug, combo);
          return this.prisma.sku.create({
            data: {
              skuCode,
              productId: product.id,
              price: 0,
              stock: 0,
              status: 'ACTIVE',
              optionValues: {
                create: combo.map((val: OptionValue) => ({
                  optionValueId: val.id,
                })),
              },
            },
          });
        }),
      );
    } else {
      await this.prisma.sku.create({
        data: {
          skuCode: `${product.slug}-DEFAULT`.toUpperCase(),
          productId: product.id,
          price: 0,
          stock: 0,
          status: 'ACTIVE',
        },
      });
    }

    // [OPTIMIZATION] Cập nhật lại cache giá
    await this.updateProductPriceRange(product.id);
  }

  async smartSkuMigration(
    productId: string,
    freshProduct: Product & {
      options: (ProductOption & { values: OptionValue[] })[];
    },
    oldSkuSnapshots: {
      id: string;
      price: any;
      stock: number;
      values: Set<string>;
    }[],
  ) {
    if (
      freshProduct &&
      freshProduct.options &&
      freshProduct.options.length > 0
    ) {
      const optionValues = freshProduct.options.map((opt) => opt.values);
      const combinations = this.cartesian(optionValues);
      const validSkuCodes = new Set<string>();
      const migratedOldSkuIds = new Set<string>();

      // [P10 OPTIMIZATION] Batch fetch existing SKUs to avoid n+1 inside the loop
      const existingSkus = await this.prisma.sku.findMany({
        where: { productId },
      });
      const skuMap = new Map(existingSkus.map((s) => [s.skuCode, s]));

      for (const combo of combinations) {
        const skuCode = this.generateSkuCode(freshProduct.slug, combo);
        validSkuCodes.add(skuCode);
        const existingSku = skuMap.get(skuCode);

        if (!existingSku) {
          let migratedPrice = 0;
          let migratedStock = 0;
          const newValues = new Set(
            combo.map((c: OptionValue) => c.value.toLowerCase()),
          );
          const ancestor = oldSkuSnapshots.find(
            (old) =>
              !migratedOldSkuIds.has(old.id) &&
              Array.from(old.values).every((val) => newValues.has(val)),
          );

          if (ancestor) {
            migratedPrice = ancestor.price ? Number(ancestor.price) : 0;
            migratedStock = 0;
            migratedOldSkuIds.add(ancestor.id);
          }

          await this.prisma.sku.create({
            data: {
              skuCode,
              productId,
              price: migratedPrice,
              stock: migratedStock,
              status: 'ACTIVE',
              optionValues: {
                create: combo.map((val: OptionValue) => ({
                  optionValueId: val.id,
                })),
              },
            },
          });
        } else {
          await this.prisma.sku.update({
            where: { id: existingSku.id },
            data: { status: 'ACTIVE' },
          });
          await this.prisma.skuToOptionValue.deleteMany({
            where: { skuId: existingSku.id },
          });
          await this.prisma.skuToOptionValue.createMany({
            data: combo.map((val: OptionValue) => ({
              skuId: existingSku.id,
              optionValueId: val.id,
            })),
          });
        }
      }

      await this.prisma.sku.updateMany({
        where: {
          productId,
          skuCode: { notIn: Array.from(validSkuCodes) },
        },
        data: { status: 'INACTIVE' },
      });
    } else if (freshProduct) {
      const defaultSkuCode = `${freshProduct.slug}-DEFAULT`.toUpperCase();
      const existingDefault = await this.prisma.sku.findUnique({
        where: { skuCode: defaultSkuCode },
      });

      if (!existingDefault) {
        await this.prisma.sku.create({
          data: {
            skuCode: defaultSkuCode,
            productId,
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

      await this.prisma.sku.updateMany({
        where: {
          productId,
          skuCode: { not: defaultSkuCode },
        },
        data: { status: 'INACTIVE' },
      });
    }

    // [OPTIMIZATION] Cập nhật lại cache giá
    await this.updateProductPriceRange(productId);
  }
}
