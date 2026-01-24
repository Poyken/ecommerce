/**
 * =====================================================================
 * MEDIA SERVICE - QUẢN LÝ TÀI NGUYÊN (HÌNH ẢNH, VIDEO, FILES)
 * =====================================================================
 *
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
