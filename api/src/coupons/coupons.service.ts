import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// import { Coupon } from '@prisma/client';
type Coupon = any; // Dummy type
import { BaseCrudService } from '../common/base-crud.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

/**
 * =====================================================================
 * COUPONS SERVICE - QUẢN LÝ MÃ GIẢM GIÁ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. VALIDATION LOGIC:
 * - Khi kiểm tra mã giảm giá, ta cần check nhiều điều kiện: `isActive`, `startDate`, `endDate`, `usageLimit`, và `minOrderAmount`.
 * - Thuật toán tính toán số tiền giảm giá dựa trên loại: PERCENTAGE (Phần trăm) hoặc FIXED (Số tiền cố định).
 * - Nếu dùng % thì phải cẩn thận với `maxDiscountAmount` (giới hạn giảm tối đa).
 *
 * 2. TIMEZONE LENIENCE (Độ trễ thời gian):
 * - Hệ thống thêm một buffer nhỏ (2 phút) khi so sánh thời gian để tránh lỗi lệch múi giờ giữa client và server (Clock Skew).
 *
 * 3. USAGE COUNTER (Biến đếm):
 * - Mỗi khi đơn hàng hoàn tất, `usedCount` sẽ tăng lên. Khi đạt `usageLimit`, mã sẽ không còn hiệu lực. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
@Injectable()
export class CouponsService extends BaseCrudService<
  Coupon,
  CreateCouponDto,
  UpdateCouponDto
> {
  constructor(private readonly prisma: PrismaService) {
    super(CouponsService.name);
  }

  protected get model() {
    // return this.prisma.coupon;
    return null as any;
  }

  /**
   * =====================================================================
   * COUPONS SERVICE - Quản lý Mã giảm giá
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. TIMEZONE & BUFFER (Xử lý múi giờ):
   * - Khi so sánh thời gian (`startDate`, `endDate`), ta cần tính đến độ trễ của server hoặc sự lệch giờ giữa client-server.
   * - `bufferMs = 2 * 60 * 1000` (2 phút) được thêm vào để "du di", tránh trường hợp user vừa bấm áp dụng đúng giây hết hạn thì bị lỗi oan.
   *
   * 2. TOÀN VẸN DỮ LIỆU (Data Integrity):
   * - Hàm `remove`: Không cho phép xóa Coupon đã từng được sử dụng trong đơn hàng (`usedInOrders`).
   * - Lý do: Nếu xóa, lịch sử đơn hàng sẽ bị lỗi tham chiếu hoặc mất thông tin giảm giá. Thay vào đó, hãy dùng Soft Delete hoặc set `isActive = false`.
   *
   * 3. LỌC TRONG BỘ NHỚ (In-Memory Filtering):
   * - Hàm `findAvailable` lấy hết coupon active về rồi filter bằng code thay vì DB query phức tạp.
   * - Lý do: Logic so sánh ngày tháng trong DB query đôi khi gặp vấn đề Timezone khó debug, xử lý ở tầng Application dễ kiểm soát hơn (với số lượng coupon ít).
   * =====================================================================
   */

  async create(createCouponDto: CreateCouponDto) {
    const tenant = getTenant();
    const existing = await this.model.findFirst({
      where: {
        code: createCouponDto.code,
        tenantId: tenant?.id,
      },
    });

    if (existing) {
      throw new ConflictException('Mã giảm giá đã tồn tại');
    }

    return this.model.create({
      data: createCouponDto,
    });
  }

  async findAll(page = 1, limit = 10) {
    return this.findAllBase(page, limit, {}, {}, { createdAt: 'desc' });
  }

  async findAvailable() {
    const now = new Date();
    // Debugging Timezone: Fetch tất cả coupon đang hoạt động và lọc trong RAM
    const candidates = await this.model.findMany({
      where: {
        isActive: true,
      },
      orderBy: { endDate: 'asc' },
    });

    return candidates.filter((coupon) => {
      const start = new Date(coupon.startDate);
      const end = new Date(coupon.endDate);

      // Timezone Lenience: Thêm buffer 2 phút
      const bufferMs = 2 * 60 * 1000;

      if (start.getTime() - bufferMs > now.getTime()) {
        return false;
      }
      if (end.getTime() + bufferMs < now.getTime()) {
        return false;
      }

      if (!coupon.usageLimit) return true;
      const invalid = coupon.usageLimit <= coupon.usedCount;
      return !invalid;
    });
  }

  async findOne(id: string) {
    return this.findOneBase(id);
  }

  async findByCode(code: string) {
    const tenant = getTenant();
    const coupon = await this.model.findFirst({
      where: {
        code,
        tenantId: tenant?.id,
      },
    });
    if (!coupon) throw new NotFoundException('Mã giảm giá không hợp lệ');
    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    // Check existence
    await this.findOneBase(id);

    if (updateCouponDto.code) {
      const tenant = getTenant();
      const existing = await this.model.findFirst({
        where: {
          code: updateCouponDto.code,
          tenantId: tenant?.id,
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Mã giảm giá đã tồn tại');
      }
    }

    return this.model.update({
      where: { id },
      data: updateCouponDto,
    });
  }

  async remove(id: string) {
    await this.findOneBase(id);

    // Kiểm tra xem coupon đã được sử dụng trong đơn hàng nào chưa
    const usedInOrders = await this.prisma.order.findFirst({
      where: { couponId: id },
    });

    if (usedInOrders) {
      throw new BadRequestException(
        'Không thể xóa mã giảm giá đã được sử dụng trong đơn hàng. Hãy ẩn nó đi.',
      );
    }

    return this.model.delete({ where: { id } });
  }

  async validateCoupon(code: string, orderAmount: number) {
    const tenant = getTenant();
    const coupon = await this.model.findFirst({
      where: {
        code,
        tenantId: tenant?.id,
      },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException(
        'Mã giảm giá không hợp lệ hoặc đã bị vô hiệu hóa',
      );
    }

    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    const bufferMs = 2 * 60 * 1000;

    if (
      start.getTime() - bufferMs > now.getTime() ||
      end.getTime() + bufferMs < now.getTime()
    ) {
      throw new BadRequestException(
        'Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng',
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${coupon.minOrderAmount.toString()} để sử dụng mã này`,
      );
    }

    const discountAmount =
      coupon.discountType === 'PERCENTAGE'
        ? (orderAmount * Number(coupon.discountValue)) / 100
        : Number(coupon.discountValue);

    const finalDiscount = coupon.maxDiscountAmount
      ? Math.min(discountAmount, Number(coupon.maxDiscountAmount))
      : discountAmount;

    return {
      isValid: true,
      discountAmount: finalDiscount,
      coupon,
    };
  }
}
