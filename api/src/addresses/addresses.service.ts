import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Nếu đây là địa chỉ đầu tiên, tự động đặt làm mặc định
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = count === 0 ? true : dto.isDefault;

    return this.prisma.address.create({
      data: {
        ...dto,
        userId,
        isDefault,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }, // Mặc định lên đầu
    });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    // Verify ownership
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // Nếu đặt làm mặc định, bỏ mặc định các địa chỉ khác
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async remove(userId: string, addressId: string) {
    // Verify ownership
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    return this.prisma.address.delete({
      where: { id: addressId },
    });
  }
}
