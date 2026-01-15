/**
 * =====================================================================
 * MEDIA SERVICE - QUẢN LÝ TÀI NGUYÊN (HÌNH ẢNH, VIDEO, FILES)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này quản lý Metadata của tất cả các file được upload lên hệ thống.
 *
 * 1. TẠI SAO PHẢI LƯU VÀO DB?
 *    - Các file thực tế thường nằm trên Cloud Storage (S3, Cloudinary).
 *    - Ta lưu metadata vào DB để quản lý mối quan hệ: Ai upload? Khi nào?
 *      File này đang dùng cho sản phẩm nào? Dung lượng bao nhiêu?
 *
 * 2. PHÂN LOẠI (Media Type):
 *    - IMAGE: Ảnh sản phẩm, ảnh avatar.
 *    - VIDEO: Review sản phẩm.
 *    - DOCUMENT: File hướng dẫn sử dụng (PDF).
 *
 * 3. MULTI-TENANCY:
 *    - Media của shop A không bao giờ được xuất hiện trong kho media của shop B.
 *    - Luôn lọc theo `tenantId`.
 * =====================================================================
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id)
      throw new BadRequestException(
        'Không xác định được Cửa hàng (Tenant context missing)',
      );
    return tenant.id;
  }

  /**
   * Lưu metadata của file media vào database
   */
  async create(dto: CreateMediaDto) {
    const tenantId = this.getTenantId();
    return this.prisma.media.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAll(type?: string, page = 1, limit = 20) {
    const tenantId = this.getTenantId();
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where: { tenantId, type },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.media.count({ where: { tenantId, type } }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const tenantId = this.getTenantId();
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media || media.tenantId !== tenantId)
      throw new NotFoundException('Không tìm thấy tệp tin');
    return media;
  }

  async remove(id: string) {
    const tenantId = this.getTenantId();
    const media = await this.findOne(id);

    // Có thể thêm logic kiểm tra xem file có đang được dùng ở đâu không
    // const used = await this.prisma.productImage.findFirst({ where: { mediaId: id } });
    // if (used) throw new BadRequestException('Tệp tin này đang được sử dụng, không thể xóa');

    return this.prisma.media.delete({ where: { id } });
  }
}
