import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: createCouponDto.code },
    });

    if (existing) {
      throw new ConflictException('Mã giảm giá đã tồn tại');
    }

    return this.prisma.coupon.create({
      data: createCouponDto,
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAvailable() {
    const now = new Date();
    // Debugging Timezone: Fetch all active coupons and filter in memory
    const candidates = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
      },
      orderBy: { endDate: 'asc' },
    });

    // console.log(`[Coupons] Server Time (UTC): ${now.toISOString()}`);

    return candidates.filter((coupon) => {
      const start = new Date(coupon.startDate);
      const end = new Date(coupon.endDate);

      // Use loose comparison or adjust if timezone issue suspected
      // For now, strict compare but log failures
      // Timezone Lenience: Add 2-minute buffer
      const bufferMs = 2 * 60 * 1000;

      if (start.getTime() - bufferMs > now.getTime()) {
        // console.log(
        //   `[Coupons] Filtered ${coupon.code}: Future Start Date (${start.toISOString()} > ${now.toISOString()})`,
        // );
        return false;
      }
      if (end.getTime() + bufferMs < now.getTime()) {
        // console.log(
        //   `[Coupons] Filtered ${coupon.code}: Expired (${end.toISOString()} < ${now.toISOString()})`,
        // );
        return false;
      }

      if (!coupon.usageLimit) return true;
      const invalid = coupon.usageLimit <= coupon.usedCount;
      if (invalid) {
        // console.log(
        //   `[Coupons] Filtering out ${coupon.code}: Limit ${coupon.usageLimit} <= Used ${coupon.usedCount}`,
        // );
      }
      return !invalid;
    });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return coupon;
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon) throw new NotFoundException('Mã giảm giá không hợp lệ');
    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Không tìm thấy mã giảm giá');

    if (updateCouponDto.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: { code: updateCouponDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Mã giảm giá đã tồn tại');
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: updateCouponDto,
    });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Không tìm thấy mã giảm giá');

    // Check if coupon has been used in orders
    const usedInOrders = await this.prisma.order.findFirst({
      where: { couponId: id },
    });

    if (usedInOrders) {
      throw new BadRequestException(
        'Không thể xóa mã giảm giá đã được sử dụng trong đơn hàng. Hãy ẩn nó đi.',
      );
    }

    return this.prisma.coupon.delete({ where: { id } });
  }

  async validateCoupon(code: string, orderAmount: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });

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
      // console.log(
      //   `[Coupons] Validation failed for ${code}: now=${now.toISOString()}, start=${start.toISOString()}, end=${end.toISOString()}`,
      // );
      throw new BadRequestException(
        'Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng',
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${coupon.minOrderAmount} để sử dụng mã này`,
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
