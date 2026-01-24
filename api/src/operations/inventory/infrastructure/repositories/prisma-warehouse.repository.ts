import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { IWarehouseRepository } from '../../domain/repositories/warehouse.repository.interface';
import { Warehouse } from '../../domain/entities/warehouse.entity';

@Injectable()
export class PrismaWarehouseRepository extends IWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Warehouse | null> {
    const data = await (this.prisma as any).warehouse.findUnique({
      where: { id },
    });
    return data ? Warehouse.fromPersistence(data) : null;
  }

  async findByTenant(tenantId: string): Promise<Warehouse[]> {
    const data = await (this.prisma as any).warehouse.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => Warehouse.fromPersistence(d));
  }

  async findDefault(tenantId: string): Promise<Warehouse | null> {
    const data = await (this.prisma as any).warehouse.findFirst({
      where: { tenantId, isDefault: true },
    });
    return data ? Warehouse.fromPersistence(data) : null;
  }

  async save(warehouse: Warehouse): Promise<Warehouse> {
    const data = warehouse.toPersistence();
    const saved = await (this.prisma as any).warehouse.upsert({
      where: { id: warehouse.id },
      create: data,
      update: data,
    });
    return Warehouse.fromPersistence(saved);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).warehouse.delete({
      where: { id },
    });
  }

  async clearDefault(tenantId: string): Promise<void> {
    await (this.prisma as any).warehouse.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
