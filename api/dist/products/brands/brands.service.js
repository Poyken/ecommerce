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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BrandsService = class BrandsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBrandDto) {
        const existing = await this.prisma.brand.findUnique({
            where: { name: createBrandDto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Thương hiệu này đã tồn tại');
        }
        return this.prisma.brand.create({
            data: createBrandDto,
        });
    }
    async findAll(search) {
        const where = search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {};
        return this.prisma.brand.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const brand = await this.prisma.brand.findUnique({ where: { id } });
        if (!brand)
            throw new common_1.NotFoundException('Không tìm thấy thương hiệu');
        return brand;
    }
    async update(id, updateBrandDto) {
        const brand = await this.prisma.brand.findUnique({ where: { id } });
        if (!brand)
            throw new common_1.NotFoundException('Không tìm thấy thương hiệu');
        if (updateBrandDto.name) {
            const existingName = await this.prisma.brand.findUnique({
                where: { name: updateBrandDto.name },
            });
            if (existingName && existingName.id !== id) {
                throw new common_1.ConflictException('Tên thương hiệu đã được sử dụng');
            }
        }
        return this.prisma.brand.update({
            where: { id },
            data: updateBrandDto,
        });
    }
    async remove(id) {
        const hasProducts = await this.prisma.product.findFirst({
            where: { brandId: id },
        });
        if (hasProducts) {
            throw new common_1.BadRequestException('Không thể xóa thương hiệu đang có sản phẩm liên kết.');
        }
        return this.prisma.brand.delete({ where: { id } });
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BrandsService);
//# sourceMappingURL=brands.service.js.map