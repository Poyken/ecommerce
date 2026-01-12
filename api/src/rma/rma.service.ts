import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';
import { ReturnStatus } from '@prisma/client';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class RmaService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id) throw new BadRequestException('Tenant context missing');
    return tenant.id;
  }

  /**
   * Tạo yêu cầu đổi trả hàng từ phía khách hàng
   * @param userId ID người dùng
   * @param dto Dữ liệu yêu cầu
   */
  async createRequest(userId: string, dto: CreateReturnRequestDto) {
    const tenantId = this.getTenantId();

    // 1. Kiểm tra đơn hàng có tồn tại và thuộc về user này không
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền yêu cầu trả hàng cho đơn này',
      );
    if (order.tenantId !== tenantId)
      throw new BadRequestException('Đơn hàng không thuộc cửa hàng này');

    // 2. Validate trạng thái đơn hàng (Phải giao thành công mới được trả)
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException(
        'Chỉ có thể yêu cầu trả hàng khi đơn hàng đã được giao thành công',
      );
    }

    // 3. Kiểm tra từng món hàng xem có hợp lệ không
    for (const itemDto of dto.items) {
      const orderItem = order.items.find((i) => i.id === itemDto.orderItemId);
      if (!orderItem)
        throw new BadRequestException(
          `Sản phẩm với ID ${itemDto.orderItemId} không có trong đơn hàng`,
        );
      if (itemDto.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Số lượng trả không được lớn hơn số lượng đã mua`,
        );
      }
    }

    // 4. Tạo ReturnRequest
    return this.prisma.returnRequest.create({
      data: {
        tenantId,
        orderId: dto.orderId,
        userId,
        reason: dto.reason,
        description: dto.description,
        images: dto.images || [],
        status: ReturnStatus.PENDING,
        items: {
          create: dto.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }

  /**
   * Admin xử lý yêu cầu đổi trả (Duyệt, Từ chối, Hoàn tiền)
   * @param id ID của ReturnRequest
   * @param dto Dữ liệu cập nhật
   */
  async updateStatus(id: string, dto: UpdateReturnStatusDto) {
    const tenantId = this.getTenantId();
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
    });

    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy yêu cầu đổi trả');
    }

    // Logic chuyển đổi trạng thái
    // Nếu chuyển sang REFUNDED -> Cần xử lý hoàn tiền (Ví dụ: cộng lại ví, gọi API Payment Gateway refund)
    // Ở đây ta chỉ cập nhật trạng thái DB, logic refund thực tế sẽ phức tạp hơn.

    return this.prisma.returnRequest.update({
      where: { id },
      data: {
        status: dto.status,
        refundAmount: dto.refundAmount, // Có thể cập nhật số tiền hoàn thực tế
        // adminNote: dto.adminNote, // TODO: Cần thêm trường adminNote vào bảng ReturnRequest trong Schema nếu muốn lưu
      },
    });
  }

  async findAll(status?: ReturnStatus) {
    const tenantId = this.getTenantId();
    return this.prisma.returnRequest.findMany({
      where: {
        tenantId,
        status: status,
      },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        order: { select: { shippingCode: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenantId = this.getTenantId();
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
        order: true,
      },
    });
    if (!request || request.tenantId !== tenantId)
      throw new NotFoundException('Không tìm thấy yêu cầu');
    return request;
  }
}
