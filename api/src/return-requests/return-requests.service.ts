/**
 * =====================================================================
 * RETURN REQUEST SERVICE (RMA) - QUẢN LÝ ĐỔI TRẢ HÀNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * RMA (Return Merchandise Authorization) là module xử lý khi khách hàng
 * không hài lòng và muốn trả hàng hoặc đổi hàng.
 *
 * 1. QUY TRÌNH (Workflow):
 *    - PENDING (Chờ duyệt): Khách gửi yêu cầu + ảnh bằng chứng.
 *    - APPROVED (Đã chấp nhận): Admin đồng ý cho trả. Khách cần gửi hàng về.
 *    - IN_TRANSIT (Đang vận chuyển): Khách cập nhật mã vận đơn (Tracking Code).
 *    - RECEIVED (Đã nhận hàng): Kho nhận được hàng và kiểm tra (Inspection).
 *    - COMPLETED (Hoàn tất): Admin quyết định Hoàn tiền (Refund) hoặc Đổi hàng.
 *    - REJECTED (Từ chối): Admin từ chối vì lý do nào đó (hàng quá hạn, hỏng do khách).
 *
 * 2. VALIDATION:
 *    - Phải kiểm tra đơn hàng có đúng của User đó không.
 *    - Số lượng trả không được lớn hơn số lượng đã mua.
 * =====================================================================
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class ReturnRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tenantId: string, dto: CreateReturnRequestDto) {
    // 1. Kiểm tra Đơn hàng thuộc về User & Tenant
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId || order.tenantId !== tenantId) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập',
      );
    }

    // 2. Kiểm tra Items có trong Đơn hàng không
    for (const item of dto.items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(
          `Sản phẩm #${item.orderItemId} không tồn tại trong đơn hàng này`,
        );
      }
      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Số lượng trả (${item.quantity}) vượt quá số lượng đã mua`,
        );
      }
      // TODO: Kiểm tra xem đã yêu cầu trả trước đó chưa?
    }

    // 3. Tạo Yêu cầu trả hàng
    return this.prisma.returnRequest.create({
      data: {
        userId,
        tenantId,
        orderId: dto.orderId,
        reason: dto.reason,
        description: dto.description,
        type: dto.type as any,
        returnMethod: dto.returnMethod as any,
        pickupAddress: dto.pickupAddress,
        refundMethod: dto.refundMethod as any,
        refundAmount: dto.refundAmount,
        bankAccount: dto.bankAccount as any,
        images: dto.images,
        status: 'PENDING',
        items: {
          create: dto.items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity,
          })),
        },
      },
    });
  }

  async findAllByUser(userId: string, tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where: { userId, tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.returnRequest.count({ where: { userId, tenantId } }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findAll(tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true } },
          order: { select: { id: true, totalAmount: true } },
        },
      }),
      this.prisma.returnRequest.count({ where: { tenantId } }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string, tenantId: string) {
    const request = await this.prisma.returnRequest.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { orderItem: true } },
        order: true,
        user: true,
      },
    });
    if (!request)
      throw new NotFoundException('Không tìm thấy yêu cầu trả hàng');
    return request;
  }

  async update(id: string, dto: UpdateReturnRequestDto, tenantId: string) {
    // Logic cập nhật từ Admin (status, kết quả kiểm tra)
    const { status, inspectionNotes, rejectedReason } = dto;

    return this.prisma.returnRequest.update({
      where: { id, tenantId },
      data: {
        status: status as any,
        inspectionNotes,
        rejectedReason,
      },
    });
  }

  async updateTracking(
    id: string,
    userId: string,
    trackingCode: string,
    carrier: string,
  ) {
    const request = await this.prisma.returnRequest.findFirst({
      where: { id, userId },
    });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu');

    if (request.status !== 'APPROVED') {
      throw new BadRequestException(
        'Yêu cầu phải được DUYỆT (APPROVED) mới có thể thêm thông tin vận chuyển',
      );
    }

    return this.prisma.returnRequest.update({
      where: { id },
      data: {
        trackingCode,
        carrier,
        status: 'IN_TRANSIT', // Tự động cập nhật trạng thái
      },
    });
  }
}
