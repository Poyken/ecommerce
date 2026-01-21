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
 *    - WAITING_FOR_RETURN: Đang đợi khách gửi hàng.
 *    - IN_TRANSIT (Đang vận chuyển): Khách cập nhật mã vận đơn.
 *    - RECEIVED (Đã nhận hàng): Kho nhận được hàng.
 *    - INSPECTING (Đang kiểm hàng): Kiểm tra chất lượng.
 *    - REFUNDED (Hoàn tiền): Đã hoàn tiền cho khách.
 *    - REJECTED (Từ chối): Admin từ chối.
 *    - CANCELLED (Hủy): Khách hủy yêu cầu.
 *
 * =====================================================================
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';
import { PrismaService } from '@core/prisma/prisma.service';
import { Prisma, ReturnStatus } from '@prisma/client';

// Status transition rules
const VALID_STATUS_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['WAITING_FOR_RETURN', 'IN_TRANSIT', 'CANCELLED'],
  WAITING_FOR_RETURN: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: ['INSPECTING'],
  INSPECTING: ['REFUNDED', 'REJECTED'],
  REFUNDED: [],
  REJECTED: [],
  CANCELLED: [],
};

@Injectable()
export class ReturnRequestsService {
  private readonly logger = new Logger(ReturnRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo yêu cầu đổi trả (Customer)
   */
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

    // 2. Kiểm tra đơn hàng đã giao chưa
    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Chỉ có thể yêu cầu đổi trả với đơn hàng đã giao',
      );
    }

    // 3. Kiểm tra thời hạn đổi trả (VD: 7 ngày)
    const deliveredDate = order.updatedAt;
    const returnDeadline = new Date(deliveredDate);
    returnDeadline.setDate(returnDeadline.getDate() + 7);

    if (new Date() > returnDeadline) {
      throw new BadRequestException(
        'Đã quá thời hạn đổi trả (7 ngày kể từ khi nhận hàng)',
      );
    }

    // 4. Kiểm tra Items có trong Đơn hàng không
    for (const item of dto.items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(
          `Sản phẩm #${item.orderItemId} không tồn tại trong đơn hàng này`,
        );
      }
      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Số lượng trả (${item.quantity}) vượt quá số lượng đã mua (${orderItem.quantity})`,
        );
      }

      // Kiểm tra xem đã yêu cầu trả trước đó chưa
      const existingReturn = await this.prisma.returnItem.findFirst({
        where: {
          orderItemId: item.orderItemId,
          returnRequest: {
            status: { notIn: ['REJECTED', 'CANCELLED'] },
          },
        },
      });
      if (existingReturn) {
        throw new BadRequestException(
          `Sản phẩm này đã có yêu cầu đổi trả đang xử lý`,
        );
      }
    }

    // 5. Tính toán số tiền hoàn trả dự kiến
    let estimatedRefund = 0;
    for (const item of dto.items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId);
      if (orderItem) {
        estimatedRefund += Number(orderItem.priceAtPurchase) * item.quantity;
      }
    }

    // 6. Tạo Yêu cầu trả hàng
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
        refundAmount: dto.refundAmount || estimatedRefund,
        bankAccount: dto.bankAccount as any,
        images: dto.images || [],
        status: 'PENDING',
        items: {
          create: dto.items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity,
          })),
        },
      },
      include: {
        items: { include: { orderItem: true } },
        order: { select: { id: true, totalAmount: true } },
      },
    });
  }

  /**
   * Danh sách yêu cầu đổi trả của User
   */
  async findAllByUser(userId: string, tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where: { userId, tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              orderItem: {
                select: {
                  productName: true,
                  skuNameSnapshot: true,
                  imageUrl: true,
                  priceAtPurchase: true,
                },
              },
            },
          },
          order: { select: { id: true } },
        },
      }),
      this.prisma.returnRequest.count({ where: { userId, tenantId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Danh sách tất cả yêu cầu (Admin)
   */
  async findAll(
    tenantId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: ReturnStatus;
      search?: string;
    },
  ) {
    const { page = 1, limit = 20, status, search } = options || {};
    const skip = (page - 1) * limit;

    const where: Prisma.ReturnRequestWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { order: { id: { contains: search } } },
          { reason: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          order: { select: { id: true, totalAmount: true } },
          items: {
            include: {
              orderItem: {
                select: {
                  productName: true,
                  imageUrl: true,
                  priceAtPurchase: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Chi tiết yêu cầu
   */
  async findOne(id: string, tenantId: string) {
    const request = await this.prisma.returnRequest.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            orderItem: {
              select: {
                id: true,
                skuId: true,
                productName: true,
                skuNameSnapshot: true,
                imageUrl: true,
                priceAtPurchase: true,
                quantity: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            shippingAddress: true,
          },
        },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    if (!request)
      throw new NotFoundException('Không tìm thấy yêu cầu trả hàng');
    return request;
  }

  /**
   * Cập nhật trạng thái (Admin)
   */
  async update(id: string, dto: UpdateReturnRequestDto, tenantId: string) {
    const request = await this.prisma.returnRequest.findFirst({
      where: { id, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }

    // Validate status transition
    if (dto.status) {
      const currentStatus = request.status;
      const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];

      if (!validNextStatuses.includes(dto.status)) {
        throw new BadRequestException(
          `Không thể chuyển từ trạng thái ${currentStatus} sang ${dto.status}`,
        );
      }
    }

    return this.prisma.returnRequest.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as any }),
        ...(dto.inspectionNotes && { inspectionNotes: dto.inspectionNotes }),
        ...(dto.rejectedReason && { rejectedReason: dto.rejectedReason }),
        ...(dto.refundAmount && { refundAmount: dto.refundAmount }),
      },
      include: {
        items: { include: { orderItem: true } },
        user: { select: { id: true, email: true } },
      },
    });
  }

  /**
   * Duyệt yêu cầu (Admin shortcut)
   */
  async approve(id: string, tenantId: string, notes?: string) {
    return this.update(
      id,
      {
        status: 'APPROVED',
        inspectionNotes: notes,
      },
      tenantId,
    );
  }

  /**
   * Từ chối yêu cầu (Admin)
   */
  async reject(id: string, tenantId: string, reason: string) {
    if (!reason) {
      throw new BadRequestException('Vui lòng nhập lý do từ chối');
    }
    return this.update(
      id,
      {
        status: 'REJECTED',
        rejectedReason: reason,
      },
      tenantId,
    );
  }

  /**
   * Xác nhận đã nhận hàng trả về
   */
  async confirmReceived(id: string, tenantId: string) {
    return this.update(id, { status: 'RECEIVED' }, tenantId);
  }

  /**
   * Hoàn tiền (Final step)
   */
  async processRefund(id: string, tenantId: string, refundAmount?: number) {
    const request = await this.findOne(id, tenantId);

    if (request.status !== 'INSPECTING') {
      throw new BadRequestException('Yêu cầu phải ở trạng thái INSPECTING');
    }

    // TODO: Integrate with Payment Gateway for actual refund
    // For now, just update status

    const result = await this.prisma.$transaction(async (tx) => {
      // Update return request
      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          ...(refundAmount && { refundAmount }),
        },
      });

      // Hoàn trả tồn kho
      for (const item of request.items) {
        // Fetch current SKU to get accurate stock
        const currentSku = await tx.sku.findUnique({
          where: { id: item.orderItem.skuId },
          select: { stock: true },
        });

        const currentStock = currentSku?.stock || 0;
        const newStock = currentStock + item.quantity;

        await tx.inventoryLog.create({
          data: {
            skuId: item.orderItem.skuId,
            changeAmount: item.quantity,
            previousStock: currentStock,
            newStock: newStock,
            reason: `Hoàn trả từ RMA #${id}`,
            tenantId,
          },
        });

        // Update SKU stock
        await tx.sku.update({
          where: { id: item.orderItem.skuId },
          data: { stock: newStock },
        });
      }

      return updated;
    });

    this.logger.log(`Refund processed for RMA #${id}`);
    return result;
  }

  /**
   * Cập nhật tracking code (User)
   */
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

    if (!['APPROVED', 'WAITING_FOR_RETURN'].includes(request.status)) {
      throw new BadRequestException(
        'Yêu cầu phải được DUYỆT mới có thể thêm thông tin vận chuyển',
      );
    }

    return this.prisma.returnRequest.update({
      where: { id },
      data: {
        trackingCode,
        carrier,
        status: 'IN_TRANSIT',
      },
    });
  }

  /**
   * Hủy yêu cầu (User)
   */
  async cancel(id: string, userId: string) {
    const request = await this.prisma.returnRequest.findFirst({
      where: { id, userId },
    });

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu');

    if (
      !['PENDING', 'APPROVED', 'WAITING_FOR_RETURN'].includes(request.status)
    ) {
      throw new BadRequestException('Không thể hủy yêu cầu ở trạng thái này');
    }

    return this.prisma.returnRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Thống kê RMA (Admin Dashboard)
   */
  async getStats(tenantId: string) {
    const [pending, inProgress, completed, rejected] = await Promise.all([
      this.prisma.returnRequest.count({
        where: { tenantId, status: 'PENDING' },
      }),
      this.prisma.returnRequest.count({
        where: {
          tenantId,
          status: {
            in: [
              'APPROVED',
              'WAITING_FOR_RETURN',
              'IN_TRANSIT',
              'RECEIVED',
              'INSPECTING',
            ],
          },
        },
      }),
      this.prisma.returnRequest.count({
        where: { tenantId, status: 'REFUNDED' },
      }),
      this.prisma.returnRequest.count({
        where: { tenantId, status: 'REJECTED' },
      }),
    ]);

    const totalRefunded = await this.prisma.returnRequest.aggregate({
      where: { tenantId, status: 'REFUNDED' },
      _sum: { refundAmount: true },
    });

    return {
      pending,
      inProgress,
      completed,
      rejected,
      totalRefunded: Number(totalRefunded._sum.refundAmount) || 0,
    };
  }
}
