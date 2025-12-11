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
exports.SkusService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SkusService = class SkusService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSkuDto) {
        const { optionValueIds, ...skuData } = createSkuDto;
        const existing = await this.prisma.sku.findUnique({
            where: { skuCode: skuData.skuCode },
        });
        if (existing) {
            throw new common_1.ConflictException('Mã SKU này đã tồn tại');
        }
        const product = await this.prisma.product.findUnique({
            where: { id: skuData.productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Sản phẩm gốc không tồn tại');
        }
        return this.prisma.sku.create({
            data: {
                ...skuData,
                optionValues: {
                    create: optionValueIds.map((valId) => ({
                        optionValueId: valId,
                    })),
                },
            },
            include: {
                optionValues: { include: { optionValue: true } },
            },
        });
    }
    async findAll(page, limit, status) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [skus, total] = await Promise.all([
            this.prisma.sku.findMany({
                where,
                skip,
                take: limit,
                include: {
                    product: { select: { name: true } },
                    optionValues: { include: { optionValue: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.sku.count({ where }),
        ]);
        return {
            data: skus,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const sku = await this.prisma.sku.findUnique({
            where: { id },
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
        });
        if (!sku)
            throw new common_1.NotFoundException('Không tìm thấy SKU');
        return sku;
    }
    async update(id, updateSkuDto) {
        const { optionValueIds, ...data } = updateSkuDto;
        const updatedSku = await this.prisma.sku.update({
            where: { id },
            data: data,
        });
        return updatedSku;
    }
    async remove(id) {
        return this.prisma.sku.delete({ where: { id } });
    }
};
exports.SkusService = SkusService;
exports.SkusService = SkusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SkusService);
//# sourceMappingURL=skus.service.js.map