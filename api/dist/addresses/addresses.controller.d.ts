import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
export declare class AddressesController {
    private readonly addressesService;
    constructor(addressesService: AddressesService);
    create(req: any, createAddressDto: CreateAddressDto): Promise<{
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
    findAll(req: any): import("@prisma/client").Prisma.PrismaPromise<{
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
    update(req: any, id: string, updateAddressDto: UpdateAddressDto): Promise<{
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
    remove(req: any, id: string): Promise<{
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
