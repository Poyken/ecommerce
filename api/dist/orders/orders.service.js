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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bullmq_2 = require("bullmq");
const payment_service_1 = require("../payment/payment.service");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    paymentService;
    emailQueue;
    constructor(prisma, paymentService, emailQueue) {
        this.prisma = prisma;
        this.paymentService = paymentService;
        this.emailQueue = emailQueue;
    }
    async create(userId, createOrderDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User không tồn tại');
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: { sku: true },
                },
            },
        });
        if (!cart || cart.items.length === 0) {
            throw new common_1.BadRequestException('Giỏ hàng trống');
        }
        let totalAmount = 0;
        const orderItemsData = [];
        for (const item of cart.items) {
            if (item.sku.stock < item.quantity) {
                throw new common_1.BadRequestException(`Sản phẩm ${item.sku.skuCode} không đủ số lượng (Yêu cầu: ${item.quantity}, Còn: ${item.sku.stock}).`);
            }
            const price = Number(item.sku.price);
            totalAmount += price * item.quantity;
            orderItemsData.push({
                skuId: item.skuId,
                quantity: item.quantity,
                priceAtPurchase: price,
            });
        }
        const order = await this.prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalAmount: totalAmount,
                    recipientName: createOrderDto.recipientName,
                    phoneNumber: createOrderDto.phoneNumber,
                    shippingAddress: createOrderDto.shippingAddress,
                    paymentMethod: createOrderDto.paymentMethod || 'COD',
                    status: client_1.OrderStatus.PENDING,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: { items: true },
            });
            for (const item of cart.items) {
                const result = await tx.sku.updateMany({
                    where: {
                        id: item.skuId,
                        stock: { gte: item.quantity },
                    },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                });
                if (result.count === 0) {
                    throw new common_1.BadRequestException(`Giao dịch thất bại! Sản phẩm ${item.sku.skuCode} vừa bị người khác mua hết.`);
                }
            }
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
            return newOrder;
        });
        try {
            if (createOrderDto.paymentMethod) {
                const paymentResult = await this.paymentService.processPayment(createOrderDto.paymentMethod, {
                    amount: Number(order.totalAmount),
                    orderId: order.id,
                });
                if (paymentResult.success) {
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: 'PAID',
                            transactionId: paymentResult.transactionId,
                        },
                    });
                    order.paymentStatus = 'PAID';
                }
            }
        }
        catch (error) {
            console.error(`Payment failed for order ${order.id}`, error);
        }
        try {
            await this.emailQueue.add('send-confirmation', {
                orderId: order.id,
                email: user.email,
                totalAmount: order.totalAmount,
            });
            console.log(`[OrderService] Đã thêm job gửi email cho Đơn hàng #${order.id}`);
        }
        catch (error) {
            console.error(`Thêm job gửi email thất bại`, error);
        }
        return order;
    }
    async findAllByUser(userId) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        sku: {
                            include: { product: true },
                        },
                    },
                },
            },
        });
    }
    async findOne(id, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        sku: {
                            include: {
                                product: true,
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
                },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        if (order.userId !== userId) {
        }
        return order;
    }
    async findAll(search) {
        const where = {};
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { recipientName: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }
        return this.prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true } } },
        });
    }
    async findOneAdmin(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        sku: {
                            include: { product: true },
                        },
                    },
                },
                user: true,
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        return order;
    }
    async updateStatus(id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const currentStatus = order.status;
        const newStatus = dto.status;
        let isValid = false;
        switch (currentStatus) {
            case client_1.OrderStatus.PENDING:
                if (newStatus === client_1.OrderStatus.PROCESSING ||
                    newStatus === client_1.OrderStatus.CANCELLED) {
                    isValid = true;
                }
                break;
            case client_1.OrderStatus.PROCESSING:
                if (newStatus === client_1.OrderStatus.SHIPPED ||
                    newStatus === client_1.OrderStatus.CANCELLED) {
                    isValid = true;
                }
                break;
            case client_1.OrderStatus.SHIPPED:
                if (newStatus === client_1.OrderStatus.DELIVERED) {
                    isValid = true;
                }
                break;
            case client_1.OrderStatus.DELIVERED:
            case client_1.OrderStatus.CANCELLED:
                isValid = false;
                break;
            default:
                isValid = false;
        }
        if (!isValid) {
            throw new common_1.BadRequestException(`Cannot change status from ${currentStatus} to ${newStatus}`);
        }
        return this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('email-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payment_service_1.PaymentService,
        bullmq_2.Queue])
], OrdersService);
//# sourceMappingURL=orders.service.js.map