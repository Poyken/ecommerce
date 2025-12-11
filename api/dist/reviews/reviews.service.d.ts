import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateReviewDto): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string | null;
        skuId: string | null;
        productId: string;
        rating: number;
        isApproved: boolean;
    }>;
    checkEligibility(userId: string, productId: string): Promise<{
        canReview: boolean;
        purchasedSkus: any[];
    }>;
    findAllByProduct(productId: string, page: number, limit: number): Promise<{
        data: ({
            user: {
                firstName: string;
                lastName: string;
            };
            sku: ({
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
            }) | null;
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string | null;
            skuId: string | null;
            productId: string;
            rating: number;
            isApproved: boolean;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            averageRating: number;
            totalReviews: number;
        };
    }>;
    findAll(page: number, limit: number): Promise<{
        data: ({
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
            product: {
                name: string;
            };
        } & {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string | null;
            skuId: string | null;
            productId: string;
            rating: number;
            isApproved: boolean;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    update(userId: string, id: string, dto: UpdateReviewDto): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string | null;
        skuId: string | null;
        productId: string;
        rating: number;
        isApproved: boolean;
    }>;
    remove(id: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string | null;
        skuId: string | null;
        productId: string;
        rating: number;
        isApproved: boolean;
    }>;
    removeOwn(userId: string, id: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string | null;
        skuId: string | null;
        productId: string;
        rating: number;
        isApproved: boolean;
    }>;
}
