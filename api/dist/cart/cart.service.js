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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CartService = class CartService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCart(userId) {
        try {
            let cart = await this.prisma.cart.findFirst({
                where: { userId: userId },
            });
            if (!cart) {
                cart = await this.prisma.cart.create({
                    data: {
                        userId: userId,
                    },
                });
            }
            const items = await this.prisma.cartItem.findMany({
                where: { cartId: cart.id },
                include: {
                    sku: {
                        include: {
                            product: true,
                            optionValues: {
                                include: {
                                    optionValue: {
                                        include: {
                                            option: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            let totalAmount = 0;
            let totalItems = 0;
            for (const item of items) {
                const p = item.sku?.salePrice ?? item.sku?.price ?? 0;
                const price = Number(p);
                totalAmount += price * item.quantity;
                totalItems += item.quantity;
            }
            return {
                ...cart,
                items,
                totalAmount,
                totalItems,
            };
        }
        catch (error) {
            console.error('CartService.getCart error:', error);
            throw error;
        }
    }
    async addToCart(userId, dto) {
        try {
            const sku = await this.prisma.sku.findUnique({
                where: { id: dto.skuId },
            });
            if (!sku)
                throw new common_1.NotFoundException('Sản phẩm (SKU) không tồn tại');
            if (sku.stock < dto.quantity) {
                throw new common_1.BadRequestException(`Không đủ hàng trong kho. Còn lại: ${sku.stock}`);
            }
            let cart = await this.prisma.cart.findUnique({ where: { userId } });
            if (!cart) {
                cart = await this.prisma.cart.create({ data: { userId } });
            }
            const existingItem = await this.prisma.cartItem.findUnique({
                where: {
                    cartId_skuId: {
                        cartId: cart.id,
                        skuId: dto.skuId,
                    },
                },
            });
            if (existingItem) {
                const newQuantity = existingItem.quantity + dto.quantity;
                if (sku.stock < newQuantity) {
                    throw new common_1.BadRequestException(`Tổng số lượng vượt quá tồn kho. Còn lại: ${sku.stock}`);
                }
                return await this.prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQuantity },
                });
            }
            else {
                return await this.prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        skuId: dto.skuId,
                        quantity: dto.quantity,
                    },
                });
            }
        }
        catch (error) {
            console.error('addToCart Service Error:', error);
            throw new common_1.BadRequestException(error.message || 'Error processing cart');
        }
    }
    async updateItem(userId, itemId, dto) {
        const item = await this.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true, sku: true },
        });
        if (!item || item.cart.userId !== userId) {
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm trong giỏ');
        }
        if (item.sku.stock < dto.quantity) {
            throw new common_1.BadRequestException(`Không đủ hàng trong kho. Còn lại item.sku.stock`);
        }
        return this.prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: dto.quantity },
        });
    }
    async removeItem(userId, itemId) {
        const item = await this.prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });
        if (!item || item.cart.userId !== userId) {
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm trong giỏ');
        }
        return this.prisma.cartItem.delete({ where: { id: itemId } });
    }
    async clearCart(userId) {
        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart)
            return;
        return this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
//# sourceMappingURL=cart.service.js.map