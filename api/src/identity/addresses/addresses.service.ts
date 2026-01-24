import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

/**
 * =====================================================================
 * ADDRESSES SERVICE - Dịch vụ quản lý địa chỉ người dùng
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    // Nếu user muốn đây là địa chỉ mặc định, các địa chỉ cũ phải bỏ cờ mặc định đi
    if (dto.isDefault) {
      await (this.prisma.address as any).updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Tự động set mặc định nếu đây là địa chỉ đầu tiên của họ
    const count = await (this.prisma.address as any).count({
      where: { userId },
    });
    const isDefault = count === 0 ? true : dto.isDefault;

    const tenant = getTenant();
    if (!tenant)
      throw new BadRequestException(
        'Không xác định được Cửa hàng (Tenant context missing)',
      );
    return (this.prisma.address as any).create({
      data: {
        ...dto,
        userId,
        isDefault,
        tenantId: tenant.id,
      },
    });
  }

  findAll(userId: string) {
    return (this.prisma.address as any).findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }, // Mặc định lên đầu
    });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    // Xác minh quyền sở hữu (Chỉ chủ sở hữu mới được sửa)
    const address = await (this.prisma.address as any).findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Địa chỉ không tồn tại hoặc bạn không có quyền truy cập');
    }

    // Logic đổi địa chỉ mặc định tương tự như lúc tạo
    if (dto.isDefault) {
      await (this.prisma.address as any).updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return (this.prisma.address as any).update({
      where: { id: addressId },
      data: dto as any,
    });
  }

  async remove(userId: string, addressId: string) {
    // Xác minh quyền sở hữu (Ngăn chặn lỗ hổng IDOR)
    const address = await (this.prisma.address as any).findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Không tìm thấy địa chỉ');
    }

    return (this.prisma.address as any).delete({
      where: { id: addressId },
    });
  }
}
