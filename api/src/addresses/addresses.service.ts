import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

/**
 * =====================================================================
 * ADDRESSES SERVICE - Dịch vụ quản lý địa chỉ người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DEFAULT ADDRESS LOGIC:
 * - Khi một địa chỉ được đặt làm mặc định (`isDefault: true`), ta phải dùng `updateMany` để bỏ đánh dấu mặc định của tất cả các địa chỉ khác của user đó.
 * - Nếu user chưa có địa chỉ nào, địa chỉ đầu tiên được tạo sẽ tự động trở thành mặc định.
 *
 * 2. OWNERSHIP VERIFICATION:
 * - Trong các hàm `update` và `remove`, ta luôn phải kiểm tra xem địa chỉ đó có thực sự thuộc về user đang đăng nhập hay không (`where: { id: addressId, userId }`).
 * - Tránh lỗi bảo mật ID Enumeration (người dùng này xóa địa chỉ của người dùng khác bằng cách đoán ID).
 *
 * 3. DATA ORDERING:
 * - Khi lấy danh sách địa chỉ, ta dùng `orderBy: { isDefault: 'desc' }` để địa chỉ mặc định luôn hiện lên đầu danh sách, tối ưu trải nghiệm người dùng.
 * =====================================================================
 */

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Nếu đây là địa chỉ đầu tiên, tự động đặt làm mặc định
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = count === 0 ? true : dto.isDefault;

    const tenant = getTenant();
    return this.prisma.address.create({
      data: {
        ...dto,
        userId,
        isDefault,
        tenantId: tenant!.id,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }, // Mặc định lên đầu
    });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    // Verify ownership
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async remove(userId: string, addressId: string) {
    // Verify ownership
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    return this.prisma.address.delete({
      where: { id: addressId },
    });
  }
}
