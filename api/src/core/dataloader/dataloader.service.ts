/**
 * =====================================================================
 * DATALOADER SERVICE - BATCH LOADING ĐỂ TRÁNH N+1 QUERIES
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * N+1 Problem là gì?
 * - Giả sử bạn có 100 Orders và mỗi Order có User.
 * - Query naive: 1 query lấy Orders + 100 queries lấy User (cho mỗi Order)
 * - Tổng: 101 queries! Rất chậm.
 *
 * DataLoader giải quyết như thế nào?
 * - Thay vì query từng User riêng lẻ, DataLoader gom tất cả userIds lại
 * - Chỉ thực hiện 1 query: WHERE id IN ('id1', 'id2', ..., 'id100')
 * - Tổng: 2 queries! Nhanh hơn 50 lần.
 *
 * Cách sử dụng:
 * 1. Inject DataLoaderService vào controller/resolver
 * 2. Gọi loader.load(id) thay vì prisma.user.findUnique()
 * 3. DataLoader tự động batch các request trong cùng 1 tick
 *
 * LƯU Ý QUAN TRỌNG:
 * - DataLoader là request-scoped (tạo mới cho mỗi request)
 * - Không dùng singleton vì sẽ cache dữ liệu cũ *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Order Detail API: Thay vì query 50 lần DB để lấy info cho 50 sản phẩm trong đơn, DataLoader chỉ query 1 lần IN (id1..., id50).
 * - GraphQL Resolvers: Dataloader là "must-have" để tối ưu hóa việc lấy dữ liệu lồng nhau (Nested Fields).
 * - Massive Reduction: Giảm tải DB CPU từ 90% xuống 5% trong các trang danh sách (List View).

 * =====================================================================
 */

import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import DataLoader from 'dataloader';

@Injectable({ scope: Scope.REQUEST })
export class DataLoaderService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================================
  // USER LOADER
  // =====================================================================
  private _userLoader: DataLoader<string, any> | null = null;

  get userLoader(): DataLoader<string, any> {
    if (!this._userLoader) {
      this._userLoader = new DataLoader<string, any>(
        async (userIds: readonly string[]) => {
          const users = await this.prisma.user.findMany({
            where: { id: { in: [...userIds] } },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          });

          // Map results to maintain order matching input IDs
          const userMap = new Map(users.map((u) => [u.id, u]));
          return userIds.map((id) => userMap.get(id) || null);
        },
        { cache: true }, // Enable per-request caching
      );
    }
    return this._userLoader;
  }

  // =====================================================================
  // PRODUCT LOADER
  // =====================================================================
  private _productLoader: DataLoader<string, any> | null = null;

  get productLoader(): DataLoader<string, any> {
    if (!this._productLoader) {
      this._productLoader = new DataLoader<string, any>(
        async (productIds: readonly string[]) => {
          const products = await this.prisma.product.findMany({
            where: { id: { in: [...productIds] } },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              minPrice: true,
              maxPrice: true,
              avgRating: true,
              images: {
                take: 1,
                orderBy: { displayOrder: 'asc' },
                select: { url: true, alt: true },
              },
            },
          });

          const productMap = new Map(products.map((p) => [p.id, p]));
          return productIds.map((id) => productMap.get(id) || null);
        },
      );
    }
    return this._productLoader;
  }

  // =====================================================================
  // SKU LOADER
  // =====================================================================
  private _skuLoader: DataLoader<string, any> | null = null;

  get skuLoader(): DataLoader<string, any> {
    if (!this._skuLoader) {
      this._skuLoader = new DataLoader<string, any>(
        async (skuIds: readonly string[]) => {
          const skus = await this.prisma.sku.findMany({
            where: { id: { in: [...skuIds] } },
            select: {
              id: true,
              skuCode: true,
              price: true,
              salePrice: true,
              stock: true,
              imageUrl: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              optionValues: {
                select: {
                  optionValue: {
                    select: {
                      id: true,
                      value: true,
                      option: {
                        select: { name: true },
                      },
                    },
                  },
                },
              },
            },
          });

          const skuMap = new Map(skus.map((s) => [s.id, s]));
          return skuIds.map((id) => skuMap.get(id) || null);
        },
      );
    }
    return this._skuLoader;
  }

  // =====================================================================
  // CATEGORY LOADER
  // =====================================================================
  private _categoryLoader: DataLoader<string, any> | null = null;

  get categoryLoader(): DataLoader<string, any> {
    if (!this._categoryLoader) {
      this._categoryLoader = new DataLoader<string, any>(
        async (categoryIds: readonly string[]) => {
          const categories = await this.prisma.category.findMany({
            where: { id: { in: [...categoryIds] } },
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
            },
          });

          const categoryMap = new Map(categories.map((c) => [c.id, c]));
          return categoryIds.map((id) => categoryMap.get(id) || null);
        },
      );
    }
    return this._categoryLoader;
  }

  // =====================================================================
  // BRAND LOADER
  // =====================================================================
  private _brandLoader: DataLoader<string, any> | null = null;

  get brandLoader(): DataLoader<string, any> {
    if (!this._brandLoader) {
      this._brandLoader = new DataLoader<string, any>(
        async (brandIds: readonly string[]) => {
          const brands = await this.prisma.brand.findMany({
            where: { id: { in: [...brandIds] } },
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          });

          const brandMap = new Map(brands.map((b) => [b.id, b]));
          return brandIds.map((id) => brandMap.get(id) || null);
        },
      );
    }
    return this._brandLoader;
  }

  // =====================================================================
  // ORDER LOADER (với items)
  // =====================================================================
  private _orderLoader: DataLoader<string, any> | null = null;

  get orderLoader(): DataLoader<string, any> {
    if (!this._orderLoader) {
      this._orderLoader = new DataLoader<string, any>(
        async (orderIds: readonly string[]) => {
          const orders = await this.prisma.order.findMany({
            where: { id: { in: [...orderIds] } },
            include: {
              items: {
                include: {
                  sku: {
                    select: {
                      id: true,
                      skuCode: true,
                      imageUrl: true,
                      product: {
                        select: { name: true, slug: true },
                      },
                    },
                  },
                },
              },
              address: true,
            },
          });

          const orderMap = new Map(orders.map((o) => [o.id, o]));
          return orderIds.map((id) => orderMap.get(id) || null);
        },
      );
    }
    return this._orderLoader;
  }

  // =====================================================================
  // REVIEW COUNT BY PRODUCT (Aggregate loader)
  // =====================================================================
  private _reviewCountLoader: DataLoader<string, number> | null = null;

  get reviewCountLoader(): DataLoader<string, number> {
    if (!this._reviewCountLoader) {
      this._reviewCountLoader = new DataLoader<string, number>(
        async (productIds: readonly string[]) => {
          const counts = await this.prisma.review.groupBy({
            by: ['productId'],
            where: {
              productId: { in: [...productIds] },
              isApproved: true,
            },
            _count: { id: true },
          });

          const countMap = new Map(
            counts.map((c) => [c.productId, c._count.id]),
          );
          return productIds.map((id) => countMap.get(id) || 0);
        },
      );
    }
    return this._reviewCountLoader;
  }
}
