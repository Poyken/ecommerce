import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            parentId: string | null;
        };
        brand: {
            id: string;
            name: string;
        };
        options: ({
            values: {
                id: string;
                imageUrl: string | null;
                value: string;
                optionId: string;
            }[];
        } & {
            id: string;
            name: string;
            productId: string;
            displayOrder: number | null;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        slug: string;
        categoryId: string;
        brandId: string;
    }>;
    findAll(query: FilterProductDto): Promise<{
        data: {
            category: {
                id: string;
                name: string;
                slug: string;
            };
            brand: {
                id: string;
                name: string;
            };
            description: string | null;
            id: string;
            createdAt: Date;
            name: string;
            slug: string;
            categoryId: string;
            brandId: string;
            options: {
                name: string;
                values: {
                    value: string;
                }[];
            }[];
            skus: {
                price: import("@prisma/client/runtime/library").Decimal | null;
                salePrice: import("@prisma/client/runtime/library").Decimal | null;
                imageUrl: string | null;
            }[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
            parentId: string | null;
        };
        brand: {
            id: string;
            name: string;
        };
        options: ({
            values: {
                id: string;
                imageUrl: string | null;
                value: string;
                optionId: string;
            }[];
        } & {
            id: string;
            name: string;
            productId: string;
            displayOrder: number | null;
        })[];
        skus: ({
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
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        slug: string;
        categoryId: string;
        brandId: string;
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<({
        options: ({
            values: {
                id: string;
                imageUrl: string | null;
                value: string;
                optionId: string;
            }[];
        } & {
            id: string;
            name: string;
            productId: string;
            displayOrder: number | null;
        })[];
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        slug: string;
        categoryId: string;
        brandId: string;
    }) | null>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        slug: string;
        categoryId: string;
        brandId: string;
    }>;
}
