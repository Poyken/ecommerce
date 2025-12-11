import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
export declare class SkusService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createSkuDto: CreateSkuDto): Promise<{
        optionValues: ({
            optionValue: {
                id: string;
                imageUrl: string | null;
                value: string;
                optionId: string;
            };
        } & {
            skuId: string;
            optionValueId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        skuCode: string;
        productId: string;
        price: import("@prisma/client/runtime/library").Decimal | null;
        salePrice: import("@prisma/client/runtime/library").Decimal | null;
        stock: number;
        imageUrl: string | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(page: number, limit: number, status?: string): Promise<{
        data: ({
            product: {
                name: string;
            };
            optionValues: ({
                optionValue: {
                    id: string;
                    imageUrl: string | null;
                    value: string;
                    optionId: string;
                };
            } & {
                skuId: string;
                optionValueId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            skuCode: string;
            productId: string;
            price: import("@prisma/client/runtime/library").Decimal | null;
            salePrice: import("@prisma/client/runtime/library").Decimal | null;
            stock: number;
            imageUrl: string | null;
            status: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        product: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            slug: string;
            categoryId: string;
            brandId: string;
        };
        optionValues: ({
            optionValue: {
                option: {
                    id: string;
                    name: string;
                    productId: string;
                    displayOrder: number | null;
                };
            } & {
                id: string;
                imageUrl: string | null;
                value: string;
                optionId: string;
            };
        } & {
            skuId: string;
            optionValueId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        skuCode: string;
        productId: string;
        price: import("@prisma/client/runtime/library").Decimal | null;
        salePrice: import("@prisma/client/runtime/library").Decimal | null;
        stock: number;
        imageUrl: string | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, updateSkuDto: UpdateSkuDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        skuCode: string;
        productId: string;
        price: import("@prisma/client/runtime/library").Decimal | null;
        salePrice: import("@prisma/client/runtime/library").Decimal | null;
        stock: number;
        imageUrl: string | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        skuCode: string;
        productId: string;
        price: import("@prisma/client/runtime/library").Decimal | null;
        salePrice: import("@prisma/client/runtime/library").Decimal | null;
        stock: number;
        imageUrl: string | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
