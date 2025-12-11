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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const slugify_1 = __importDefault(require("slugify"));
const prisma_service_1 = require("../../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCategoryDto) {
        const slug = createCategoryDto.slug ||
            (0, slugify_1.default)(createCategoryDto.name, { lower: true, strict: true });
        const existing = await this.prisma.category.findFirst({
            where: { OR: [{ name: createCategoryDto.name }, { slug }] },
        });
        if (existing) {
            throw new common_1.ConflictException('Danh mục với tên hoặc slug này đã tồn tại');
        }
        if (createCategoryDto.parentId) {
            const parent = await this.prisma.category.findUnique({
                where: { id: createCategoryDto.parentId },
            });
            if (!parent) {
                throw new common_1.BadRequestException('Danh mục cha không tồn tại');
            }
        }
        return this.prisma.category.create({
            data: {
                ...createCategoryDto,
                slug,
            },
        });
    }
    async findAll(search) {
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        return this.prisma.category.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException('Không tìm thấy danh mục');
        return category;
    }
    async update(id, updateCategoryDto) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException('Không tìm thấy danh mục');
        if (updateCategoryDto.slug) {
            const existingSlug = await this.prisma.category.findUnique({
                where: { slug: updateCategoryDto.slug },
            });
            if (existingSlug && existingSlug.id !== id) {
                throw new common_1.ConflictException('Slug này đã được sử dụng bởi danh mục khác');
            }
        }
        return this.prisma.category.update({
            where: { id },
            data: updateCategoryDto,
        });
    }
    async remove(id) {
        const hasProducts = await this.prisma.product.findFirst({
            where: { categoryId: id },
        });
        if (hasProducts) {
            throw new common_1.BadRequestException('Không thể xóa danh mục đang chứa sản phẩm. Hãy xóa hoặc di chuyển sản phẩm trước.');
        }
        const hasChildren = await this.prisma.category.findFirst({
            where: { parentId: id },
        });
        if (hasChildren) {
            throw new common_1.BadRequestException('Không thể xóa danh mục đang chứa danh mục con.');
        }
        return this.prisma.category.delete({ where: { id } });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map