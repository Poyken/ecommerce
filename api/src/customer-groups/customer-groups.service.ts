import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  CreateCustomerGroupDto,
  CreatePriceListDto,
} from './dto/customer-group.dto';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class CustomerGroupsService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id) throw new BadRequestException('Tenant context missing');
    return tenant.id;
  }

  // --- CUSTOMER GROUPS ---

  async createGroup(dto: CreateCustomerGroupDto) {
    const tenantId = this.getTenantId();

    const existing = await this.prisma.customerGroup.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: dto.name,
        },
      },
    });

    if (existing) throw new ConflictException('Tên nhóm khách hàng đã tồn tại');

    return this.prisma.customerGroup.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAllGroups() {
    const tenantId = this.getTenantId();
    return this.prisma.customerGroup.findMany({
      where: { tenantId },
      include: { priceList: true, _count: { select: { users: true } } },
    });
  }

  // --- PRICE LISTS ---

  async createPriceList(dto: CreatePriceListDto) {
    const tenantId = this.getTenantId();
    const { items, ...data } = dto;

    return this.prisma.priceList.create({
      data: {
        ...data,
        tenantId,
        items: {
          create: items.map((item) => ({
            skuId: item.skuId,
            price: item.price,
            compareAtPrice: item.compareAtPrice,
            tenantId, // Required for nested creates
          })),
        },
      },
      include: { items: true },
    });
  }

  async getPriceListForUser(userId: string) {
    const tenantId = this.getTenantId();

    // 1. Lấy thông tin user để xem thuộc nhóm nào
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerGroup: { include: { priceList: { include: { items: true } } } },
      },
    });

    if (!user || user.tenantId !== tenantId)
      throw new NotFoundException('User không tồn tại');

    // 2. Nếu user có nhóm và nhóm có bảng giá -> Trả về bảng giá đó
    if (user.customerGroup?.priceList) {
      return user.customerGroup.priceList;
    }

    // 3. Nếu không, tìm bảng giá mặc định của Tenant
    const defaultList = await this.prisma.priceList.findFirst({
      where: { tenantId, isDefault: true },
      include: { items: true },
    });

    return defaultList || null; // Nếu null thì dùng giá gốc trong bảng Sku
  }
}
