import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(req: any): Promise<{
        items: ({
            sku: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            skuId: string;
            quantity: number;
            cartId: string;
        })[];
        totalAmount: number;
        totalItems: number;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addToCart(req: any, dto: AddToCartDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        skuId: string;
        quantity: number;
        cartId: string;
    }>;
    updateItem(req: any, itemId: string, dto: UpdateCartItemDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        skuId: string;
        quantity: number;
        cartId: string;
    }>;
    removeItem(req: any, itemId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        skuId: string;
        quantity: number;
        cartId: string;
    }>;
    clearCart(req: any): Promise<import("@prisma/client").Prisma.BatchPayload | undefined>;
}
