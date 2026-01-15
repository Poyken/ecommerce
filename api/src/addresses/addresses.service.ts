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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. LOGIC ĐỊA CHỈ MẶC ĐỊNH (Default Address):
 * - Khi user set một địa chỉ là `Mặc định` (`isDefault: true`), logic hệ thống sẽ:
 *   - Bước 1: Reset `isDefault = false` cho TẤT CẢ các địa chỉ cũ của user đó.
 *   - Bước 2: Set `isDefault = true` cho địa chỉ đang thao tác.
 * - Đặc biệt: Nếu user chưa có địa chỉ nào, địa chỉ đầu tiên tạo ra sẽ auto là mặc định.
 *
 * 2. XÁC THỰC QUYỀN SỞ HỮU (Ownership Verification):
 * - RẤT QUAN TRỌNG: Trong các hàm `update` và `remove`, vế `where` luôn phải kẹp thêm `userId`.
 * - Mục đích để tránh lỗ hổng bảo mật IDOR (Insecure Direct Object References), nơi hacker đổi ID để xóa địa chỉ của người khác.
 *
 * 3. HỨNG DỮ LIỆU (Data Ordering):
 * - Luôn đưa địa chỉ mặc định lên đầu danh sách (`orderBy: { isDefault: 'desc' }`) để khi vào trang Checkout user thấy ngay. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    // Nếu user muốn đây là địa chỉ mặc định, các địa chỉ cũ phải bỏ cờ mặc định đi
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Tự động set mặc định nếu đây là địa chỉ đầu tiên của họ
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = count === 0 ? true : dto.isDefault;

    const tenant = getTenant();
    if (!tenant)
      throw new BadRequestException(
        'Không xác định được Cửa hàng (Tenant context missing)',
      );
    return this.prisma.address.create({
      data: {
        ...dto,
        userId,
        isDefault,
        tenantId: tenant.id,
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
    // Xác minh quyền sở hữu (Chỉ chủ sở hữu mới được sửa)
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Địa chỉ không tồn tại hoặc bạn không có quyền truy cập');
    }

    // Logic đổi địa chỉ mặc định tương tự như lúc tạo
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
    // Xác minh quyền sở hữu (Ngăn chặn lỗ hổng IDOR)
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Không tìm thấy địa chỉ');
    }

    return this.prisma.address.delete({
      where: { id: addressId },
    });
  }
}
