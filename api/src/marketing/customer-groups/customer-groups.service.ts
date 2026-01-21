/**
 * =====================================================================
 * B2B PRICING SERVICE - BẢNG GIÁ THEO NHÓM KHÁCH HÀNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này cho phép tạo bảng giá riêng cho từng nhóm khách hàng (B2B).
 * Ví dụ: Đại lý cấp 1 được giá gốc, Đại lý cấp 2 được 10% off, VIP được 5% off.
 *
 * 1. CẤU TRÚC:
 *    - CustomerGroup: Nhóm khách hàng (VIP, Wholesale, Đại lý C1, C2...)
 *    - PriceList: Bảng giá (có thể gắn với nhiều nhóm)
 *    - PriceListItem: Giá cụ thể cho từng SKU trong bảng giá
 *
 * 2. LOGIC LẤY GIÁ:
 *    a) Kiểm tra User thuộc CustomerGroup nào
 *    b) Lấy PriceList của CustomerGroup đó
 *    c) Tìm giá SKU trong PriceListItem
 *    d) Nếu không có -> Fallback về giá gốc trong bảng Sku
 *
 * =====================================================================
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  CreateCustomerGroupDto,
  UpdateCustomerGroupDto,
  CreatePriceListDto,
  UpdatePriceListDto,
  AddPriceListItemDto,
} from './dto/customer-group.dto';
import { getTenant } from '@core/tenant/tenant.context';
import { Prisma } from '@prisma/client';

export interface PricingResult {
  skuId: string;
  originalPrice: number;
  finalPrice: number;
  discount: number;
  discountPercent: number;
  priceListId: string | null;
  priceListName: string | null;
}

@Injectable()
export class CustomerGroupsService {
  private readonly logger = new Logger(CustomerGroupsService.name);

  constructor(private prisma: PrismaService) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id) throw new BadRequestException('Tenant context missing');
    return tenant.id;
  }

  // =====================================================================
  // CUSTOMER GROUPS
  // =====================================================================

  async createGroup(dto: CreateCustomerGroupDto) {
    const tenantId = this.getTenantId();

    const existing = await this.prisma.customerGroup.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });

    if (existing) throw new ConflictException('Tên nhóm khách hàng đã tồn tại');

    return this.prisma.customerGroup.create({
      data: { ...dto, tenantId },
      include: { priceList: true },
    });
  }

  async findAllGroups() {
    const tenantId = this.getTenantId();
    return this.prisma.customerGroup.findMany({
      where: { tenantId },
      include: {
        priceList: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneGroup(id: string) {
    const tenantId = this.getTenantId();
    const group = await this.prisma.customerGroup.findUnique({
      where: { id },
      include: {
        priceList: { include: { items: { take: 10 } } },
        users: {
          select: { id: true, email: true, firstName: true, lastName: true },
          take: 20,
        },
      },
    });

    if (!group || group.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy nhóm khách hàng');
    }

    return group;
  }

  async updateGroup(id: string, dto: UpdateCustomerGroupDto) {
    const tenantId = this.getTenantId();
    const existing = await this.prisma.customerGroup.findUnique({
      where: { id },
    });

    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy nhóm khách hàng');
    }

    return this.prisma.customerGroup.update({
      where: { id },
      data: dto,
      include: { priceList: true },
    });
  }

  async deleteGroup(id: string) {
    const tenantId = this.getTenantId();
    const group = await this.prisma.customerGroup.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!group || group.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy nhóm khách hàng');
    }

    if (group._count.users > 0) {
      throw new BadRequestException(
        `Không thể xóa nhóm vẫn còn ${group._count.users} thành viên`,
      );
    }

    return this.prisma.customerGroup.delete({ where: { id } });
  }

  async addUserToGroup(groupId: string, userId: string) {
    const tenantId = this.getTenantId();

    const [group, user] = await Promise.all([
      this.prisma.customerGroup.findUnique({ where: { id: groupId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!group || group.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy nhóm khách hàng');
    }
    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { customerGroupId: groupId },
    });
  }

  async removeUserFromGroup(userId: string) {
    const tenantId = this.getTenantId();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { customerGroupId: null },
    });
  }

  // =====================================================================
  // PRICE LISTS
  // =====================================================================

  async createPriceList(dto: CreatePriceListDto) {
    const tenantId = this.getTenantId();
    const { items, ...data } = dto;

    // Nếu set là default, phải unset các default khác
    if (data.isDefault) {
      await this.prisma.priceList.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.priceList.create({
      data: {
        ...data,
        tenantId,
        items: {
          create:
            items?.map((item) => ({
              skuId: item.skuId,
              price: item.price,
              compareAtPrice: item.compareAtPrice,
              tenantId,
            })) || [],
        },
      },
      include: { items: true, customerGroups: true },
    });
  }

  async findAllPriceLists() {
    const tenantId = this.getTenantId();
    return this.prisma.priceList.findMany({
      where: { tenantId },
      include: {
        customerGroups: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePriceList(id: string) {
    const tenantId = this.getTenantId();
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sku: {
              select: {
                skuCode: true,
                price: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        customerGroups: true,
      },
    });

    if (!priceList || priceList.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy bảng giá');
    }

    return priceList;
  }

  async updatePriceList(id: string, dto: UpdatePriceListDto) {
    const tenantId = this.getTenantId();
    const existing = await this.prisma.priceList.findUnique({ where: { id } });

    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy bảng giá');
    }

    const { items, ...data } = dto;

    // Nếu set là default, phải unset các default khác
    if (data.isDefault) {
      await this.prisma.priceList.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.priceList.update({
      where: { id },
      data,
      include: { items: true, customerGroups: true },
    });
  }

  async deletePriceList(id: string) {
    const tenantId = this.getTenantId();
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
      include: { _count: { select: { customerGroups: true } } },
    });

    if (!priceList || priceList.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy bảng giá');
    }

    if (priceList._count.customerGroups > 0) {
      throw new BadRequestException(
        'Không thể xóa bảng giá đang được sử dụng bởi nhóm khách hàng',
      );
    }

    return this.prisma.priceList.delete({ where: { id } });
  }

  async addPriceListItem(priceListId: string, dto: AddPriceListItemDto) {
    const tenantId = this.getTenantId();

    const priceList = await this.prisma.priceList.findUnique({
      where: { id: priceListId },
    });

    if (!priceList || priceList.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy bảng giá');
    }

    // Upsert - nếu đã có thì update, chưa có thì create
    return this.prisma.priceListItem.upsert({
      where: {
        priceListId_skuId: {
          priceListId,
          skuId: dto.skuId,
        },
      },
      create: {
        priceListId,
        skuId: dto.skuId,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        tenantId,
      },
      update: {
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
      },
    });
  }

  async removePriceListItem(priceListId: string, skuId: string) {
    const tenantId = this.getTenantId();

    const priceList = await this.prisma.priceList.findUnique({
      where: { id: priceListId },
    });

    if (!priceList || priceList.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy bảng giá');
    }

    return this.prisma.priceListItem.delete({
      where: {
        priceListId_skuId: { priceListId, skuId },
      },
    });
  }

  async assignPriceListToGroup(priceListId: string, groupId: string) {
    const tenantId = this.getTenantId();

    const [priceList, group] = await Promise.all([
      this.prisma.priceList.findUnique({ where: { id: priceListId } }),
      this.prisma.customerGroup.findUnique({ where: { id: groupId } }),
    ]);

    if (!priceList || priceList.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy bảng giá');
    }
    if (!group || group.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy nhóm khách hàng');
    }

    return this.prisma.customerGroup.update({
      where: { id: groupId },
      data: { priceListId },
      include: { priceList: true },
    });
  }

  // =====================================================================
  // PRICING LOGIC - Core Functionality
  // =====================================================================

  /**
   * Lấy bảng giá áp dụng cho User
   */
  async getPriceListForUser(userId: string) {
    const tenantId = this.getTenantId();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerGroup: {
          include: { priceList: { include: { items: true } } },
        },
      },
    });

    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User không tồn tại');
    }

    // User có nhóm và nhóm có bảng giá
    if (user.customerGroup?.priceList) {
      return user.customerGroup.priceList;
    }

    // Fallback: Bảng giá mặc định
    const defaultList = await this.prisma.priceList.findFirst({
      where: { tenantId, isDefault: true, isActive: true },
      include: { items: true },
    });

    return defaultList; // null = dùng giá gốc
  }

  /**
   * Lấy giá cho một SKU cụ thể dựa vào User
   */
  async getPriceForSku(skuId: string, userId?: string): Promise<PricingResult> {
    const tenantId = this.getTenantId();

    // Lấy giá gốc của SKU
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      select: { id: true, price: true, salePrice: true },
    });

    if (!sku) {
      throw new NotFoundException('SKU không tồn tại');
    }

    const originalPrice = Number(sku.salePrice || sku.price) || 0;
    let finalPrice = originalPrice;
    let priceListId: string | null = null;
    let priceListName: string | null = null;

    // Nếu có userId, kiểm tra bảng giá
    if (userId) {
      const priceList = await this.getPriceListForUser(userId);

      if (priceList) {
        const priceItem = priceList.items.find((item) => item.skuId === skuId);
        if (priceItem) {
          finalPrice = Number(priceItem.price);
          priceListId = priceList.id;
          priceListName = priceList.name;
        }
      }
    }

    const discount = originalPrice - finalPrice;
    const discountPercent =
      originalPrice > 0 ? Math.round((discount / originalPrice) * 100) : 0;

    return {
      skuId,
      originalPrice,
      finalPrice,
      discount,
      discountPercent,
      priceListId,
      priceListName,
    };
  }

  /**
   * Lấy giá cho nhiều SKUs (Batch)
   */
  /**
   * Lấy giá cho nhiều SKUs (Batch) - Optimized N+1
   */
  async getPricesForSkus(
    skuIds: string[],
    userId?: string,
  ): Promise<Record<string, PricingResult>> {
    const tenantId = this.getTenantId();

    // 1. Fetch all SCU info
    const skus = await this.prisma.sku.findMany({
      where: { id: { in: skuIds } },
      select: { id: true, price: true, salePrice: true },
    });

    const skuMap = new Map(skus.map((s) => [s.id, s]));
    const results: Record<string, PricingResult> = {};

    // 2. Determine Price List ID
    let priceListId: string | null = null;
    let priceListName: string | null = null;

    if (userId) {
      // Check User's Group Price List
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          customerGroup: {
            select: {
              priceList: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (user?.customerGroup?.priceList) {
        priceListId = user.customerGroup.priceList.id;
        priceListName = user.customerGroup.priceList.name;
      } else {
        // Fallback to Default Price List
        const defaultList = await this.prisma.priceList.findFirst({
          where: { tenantId, isDefault: true, isActive: true },
          select: { id: true, name: true },
        });
        if (defaultList) {
          priceListId = defaultList.id;
          priceListName = defaultList.name;
        }
      }
    }

    // 3. Fetch specific Price Items if a list is active
    const priceItemsMap = new Map<string, number>();
    if (priceListId) {
      const priceItems = await this.prisma.priceListItem.findMany({
        where: {
          priceListId,
          skuId: { in: skuIds },
          tenantId,
        },
        select: { skuId: true, price: true },
      });
      priceItems.forEach((item) =>
        priceItemsMap.set(item.skuId, Number(item.price)),
      );
    }

    // 4. Calculate results
    for (const skuId of skuIds) {
      const sku = skuMap.get(skuId);
      if (!sku) continue;

      const originalPrice = Number(sku.salePrice || sku.price) || 0;
      let finalPrice = originalPrice;
      let appliedListId: string | null = null;
      let appliedListName: string | null = null;

      if (priceItemsMap.has(skuId)) {
        finalPrice = priceItemsMap.get(skuId)!;
        appliedListId = priceListId;
        appliedListName = priceListName;
      }

      const discount = originalPrice - finalPrice;
      const discountPercent =
        originalPrice > 0 ? Math.round((discount / originalPrice) * 100) : 0;

      results[skuId] = {
        skuId,
        originalPrice,
        finalPrice,
        discount,
        discountPercent,
        priceListId: appliedListId,
        priceListName: appliedListName,
      };
    }

    return results;
  }

  // =====================================================================
  // STATISTICS
  // =====================================================================

  async getB2BStats() {
    const tenantId = this.getTenantId();

    const [totalGroups, totalPriceLists, totalB2BCustomers] = await Promise.all(
      [
        this.prisma.customerGroup.count({ where: { tenantId } }),
        this.prisma.priceList.count({ where: { tenantId } }),
        this.prisma.user.count({
          where: { tenantId, customerGroupId: { not: null } },
        }),
      ],
    );

    return {
      totalGroups,
      totalPriceLists,
      totalB2BCustomers,
    };
  }
}
