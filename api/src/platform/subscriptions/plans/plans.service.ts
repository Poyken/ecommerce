/**
 * =====================================================================
 * PLANS SERVICE - Logic quản lý gói cước
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TRƯỜNG JSON (JSON Field):
 * - `features`: Trong DB lưu là String (JSON), nhưng DTO đầu vào là Array.
 * - Service cần dùng `JSON.stringify` khi lưu và `JSON.parse` (nếu cần xử lý thêm) khi đọc.
 *
 * 2. TÍNH LŨY ĐẲNG (Idempotency):
 * - Các hàm update nên kiểm tra sự tồn tại của bản ghi trước khi thực hiện
 *   (Prisma `update` sẽ ném lỗi nếu ID không tồn tại, nên try-catch là cần thiết ở tầng trên). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
  }

  async create(dto: CreatePlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: {
        ...dto,
        features: dto.features ? JSON.stringify(dto.features) : '[]',
      },
    });
  }

  async update(id: string, dto: Partial<CreatePlanDto>) {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...dto,
        features: dto.features ? JSON.stringify(dto.features) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }
}
