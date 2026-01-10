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
