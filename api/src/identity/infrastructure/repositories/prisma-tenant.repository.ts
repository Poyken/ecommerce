import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { ITenantRepository } from '../../domain/repositories/tenant.repository.interface';
import { Tenant } from '../../domain/entities/tenant.entity';

@Injectable()
export class PrismaTenantRepository extends ITenantRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Tenant | null> {
    const data = await this.prisma.tenant.findUnique({
      where: { id },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const data = await this.prisma.tenant.findUnique({
      where: { domain },
    });
    return data ? this.toDomain(data) : null;
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    const data = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByOwner(ownerId: string): Promise<Tenant[]> {
    const dataArray = await this.prisma.tenant.findMany({
      where: { ownerId },
    });
    return dataArray.map((data) => this.toDomain(data));
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const data = tenant.toPersistence() as any;
    const { id, ...updateData } = data;

    const saved = await this.prisma.tenant.upsert({
      where: { id: tenant.id },
      create: data,
      update: updateData,
    });

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: { id },
    });
    return count > 0;
  }

  private toDomain(data: any): Tenant {
    return Tenant.fromPersistence({
      ...data,
      plan: data.plan as any,
    });
  }
}
