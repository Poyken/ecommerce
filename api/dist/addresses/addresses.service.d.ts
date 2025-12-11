import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
export declare class AddressesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateAddressDto): Promise<{
        recipientName: string;
        phoneNumber: string;
        street: string;
        city: string;
        district: string;
        ward: string | null;
        postalCode: string | null;
        country: string | null;
        isDefault: boolean;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        recipientName: string;
        phoneNumber: string;
        street: string;
        city: string;
        district: string;
        ward: string | null;
        postalCode: string | null;
        country: string | null;
        isDefault: boolean;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    update(userId: string, addressId: string, dto: UpdateAddressDto): Promise<{
        recipientName: string;
        phoneNumber: string;
        street: string;
        city: string;
        district: string;
        ward: string | null;
        postalCode: string | null;
        country: string | null;
        isDefault: boolean;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(userId: string, addressId: string): Promise<{
        recipientName: string;
        phoneNumber: string;
        street: string;
        city: string;
        district: string;
        ward: string | null;
        postalCode: string | null;
        country: string | null;
        isDefault: boolean;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
