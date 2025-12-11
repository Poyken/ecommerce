import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: any, createOrderDto: CreateOrderDto): Promise<{
        items: {
            id: string;
            skuId: string;
            quantity: number;
            priceAtPurchase: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        }[];
    } & {
        recipientName: string;
        phoneNumber: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        transactionId: string | null;
        shippingAddress: string;
        paymentMethod: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingFee: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        orderDate: Date;
    }>;
    findMyOrders(req: any): Promise<({
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
            skuId: string;
            quantity: number;
            priceAtPurchase: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        })[];
    } & {
        recipientName: string;
        phoneNumber: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        transactionId: string | null;
        shippingAddress: string;
        paymentMethod: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingFee: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        orderDate: Date;
    })[]>;
    findOneMyOrder(req: any, id: string): Promise<{
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
            skuId: string;
            quantity: number;
            priceAtPurchase: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        })[];
    } & {
        recipientName: string;
        phoneNumber: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        transactionId: string | null;
        shippingAddress: string;
        paymentMethod: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingFee: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        orderDate: Date;
    }>;
    findAll(search?: string): Promise<({
        user: {
            email: string;
        };
    } & {
        recipientName: string;
        phoneNumber: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        transactionId: string | null;
        shippingAddress: string;
        paymentMethod: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingFee: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        orderDate: Date;
    })[]>;
    findOne(id: string): Promise<{
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
        };
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
            skuId: string;
            quantity: number;
            priceAtPurchase: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        })[];
    } & {
        recipientName: string;
        phoneNumber: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        transactionId: string | null;
        shippingAddress: string;
        paymentMethod: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingFee: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        orderDate: Date;
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<{
        recipientName: string;
        phoneNumber: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        transactionId: string | null;
        shippingAddress: string;
        paymentMethod: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingFee: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        orderDate: Date;
    }>;
}
