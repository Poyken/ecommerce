"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const existing = await this.prisma.review.findFirst({
            where: {
                userId,
                productId: dto.productId,
                skuId: dto.skuId || null,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Bạn đã đánh giá sản phẩm/biến thể này rồi.');
        }
        const whereOrderItems = {
            sku: {
                productId: dto.productId,
            },
        };
        if (dto.skuId) {
            whereOrderItems.skuId = dto.skuId;
        }
        const orderHistory = await this.prisma.order.findFirst({
            where: {
                userId,
                status: 'DELIVERED',
                items: {
                    some: whereOrderItems,
                },
            },
        });
        if (!orderHistory) {
            throw new common_1.BadRequestException('Bạn chỉ có thể đánh giá sản phẩm/biến thể đã mua và đã nhận hàng thành công.');
        }
        return this.prisma.review.create({
            data: {
                userId,
                productId: dto.productId,
                skuId: dto.skuId || null,
                rating: dto.rating,
                content: dto.content,
                isApproved: true,
            },
        });
    }
    async checkEligibility(userId, productId) {
        const orderItems = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    userId,
                    status: 'DELIVERED',
                },
                sku: {
                    productId,
                },
            },
            include: {
                sku: {
                    include: {
                        optionValues: {
                            include: {
                                optionValue: {
                                    include: { option: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        const reviews = await this.prisma.review.findMany({
            where: {
                userId,
                productId,
            },
        });
        const reviewMap = new Map();
        reviews.forEach((r) => {
            if (r.skuId) {
                reviewMap.set(r.skuId, r);
            }
        });
        const skuMap = new Map();
        orderItems.forEach((item) => {
            if (!skuMap.has(item.sku.id)) {
                skuMap.set(item.sku.id, {
                    ...item.sku,
                    review: reviewMap.get(item.sku.id) || null,
                });
            }
        });
        const purchasedSkus = Array.from(skuMap.values());
        return {
            canReview: purchasedSkus.some(s => !s.review),
            purchasedSkus,
        };
    }
    async findAllByProduct(productId, page, limit) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { productId, isApproved: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { firstName: true, lastName: true },
                    },
                    sku: {
                        include: {
                            optionValues: {
                                include: {
                                    optionValue: {
                                        include: { option: true },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.review.count({
                where: { productId, isApproved: true },
            }),
        ]);
        const aggregate = await this.prisma.review.aggregate({
            where: { productId, isApproved: true },
            _avg: { rating: true },
            _count: true,
        });
        return {
            data: reviews,
            meta: {
                total,
                page,
                limit,
                averageRating: aggregate._avg.rating || 0,
                totalReviews: aggregate._count,
            },
        };
    }
    async findAll(page, limit) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { firstName: true, lastName: true, email: true },
                    },
                    product: {
                        select: { name: true },
                    },
                },
            }),
            this.prisma.review.count(),
        ]);
        return {
            data: reviews,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async update(userId, id, dto) {
        const review = await this.prisma.review.findUnique({
            where: { id },
        });
        if (!review) {
            throw new common_1.BadRequestException('Đánh giá không tồn tại');
        }
        if (review.userId !== userId) {
            throw new common_1.BadRequestException('Bạn không có quyền chỉnh sửa đánh giá này');
        }
        return this.prisma.review.update({
            where: { id },
            data: {
                rating: dto.rating,
                content: dto.content,
            },
        });
    }
    async remove(id) {
        return this.prisma.review.delete({ where: { id } });
    }
    async removeOwn(userId, id) {
        const review = await this.prisma.review.findUnique({
            where: { id },
        });
        if (!review) {
            throw new common_1.BadRequestException('Đánh giá không tồn tại');
        }
        if (review.userId !== userId) {
            throw new common_1.BadRequestException('Bạn không có quyền xóa đánh giá này');
        }
        return this.prisma.review.delete({ where: { id } });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map