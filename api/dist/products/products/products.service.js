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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const slugify_1 = __importDefault(require("slugify"));
const prisma_service_1 = require("../../prisma/prisma.service");
const filter_product_dto_1 = require("./dto/filter-product.dto");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createProductDto) {
        const { options, ...productData } = createProductDto;
        const slug = productData.slug ||
            (0, slugify_1.default)(productData.name, { lower: true, strict: true }) +
                '-' +
                Date.now();
        const [category, brand] = await Promise.all([
            this.prisma.category.findUnique({
                where: { id: productData.categoryId },
            }),
            this.prisma.brand.findUnique({ where: { id: productData.brandId } }),
        ]);
        if (!category)
            throw new common_1.NotFoundException('Danh mục không tồn tại');
        if (!brand)
            throw new common_1.NotFoundException('Thương hiệu không tồn tại');
        const product = await this.prisma.product.create({
            data: {
                ...productData,
                slug,
                options: {
                    create: options?.map((opt, index) => ({
                        name: opt.name,
                        displayOrder: index,
                        values: {
                            create: opt.values.map((val) => ({ value: val })),
                        },
                    })),
                },
            },
            include: {
                options: {
                    include: { values: true },
                },
                category: true,
                brand: true,
            },
        });
        if (product.options && product.options.length > 0) {
            const optionValues = product.options.map((opt) => opt.values);
            const combinations = this.cartesian(optionValues);
            for (const combo of combinations) {
                const variantSuffix = combo
                    .map((v) => (0, slugify_1.default)(v.value, { lower: true }))
                    .join('-');
                const skuCode = `${slug}-${variantSuffix}`.toUpperCase();
                await this.prisma.sku.create({
                    data: {
                        skuCode,
                        productId: product.id,
                        price: 0,
                        stock: 0,
                        status: 'ACTIVE',
                        optionValues: {
                            create: combo.map((val) => ({
                                optionValueId: val.id,
                            })),
                        },
                    },
                });
            }
        }
        else {
            await this.prisma.sku.create({
                data: {
                    skuCode: `${slug}-DEFAULT`.toUpperCase(),
                    productId: product.id,
                    price: 0,
                    stock: 0,
                    status: 'ACTIVE',
                },
            });
        }
        return product;
    }
    cartesian(args) {
        const r = [];
        const max = args.length - 1;
        function helper(arr, i) {
            for (let j = 0, l = args[i].length; j < l; j++) {
                const a = arr.slice(0);
                a.push(args[i][j]);
                if (i == max)
                    r.push(a);
                else
                    helper(a, i + 1);
            }
        }
        helper([], 0);
        return r;
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, categoryId, brandId, minPrice, maxPrice, sort, } = query;
        const skip = (page - 1) * limit;
        const where = {
            AND: [
                search
                    ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { description: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {},
                categoryId ? { categoryId } : {},
                brandId ? { brandId } : {},
                minPrice !== undefined || maxPrice !== undefined
                    ? {
                        skus: {
                            some: {
                                price: {
                                    gte: minPrice,
                                    lte: maxPrice,
                                },
                            },
                        },
                    }
                    : {},
            ],
        };
        let orderBy = { createdAt: 'desc' };
        if (sort) {
            switch (sort) {
                case filter_product_dto_1.SortOption.NEWEST:
                    orderBy = { createdAt: 'desc' };
                    break;
                case filter_product_dto_1.SortOption.OLDEST:
                    orderBy = { createdAt: 'asc' };
                    break;
                case filter_product_dto_1.SortOption.PRICE_ASC:
                    orderBy = { name: 'asc' };
                    break;
                case filter_product_dto_1.SortOption.PRICE_DESC:
                    orderBy = { name: 'desc' };
                    break;
            }
        }
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    createdAt: true,
                    categoryId: true,
                    brandId: true,
                    category: {
                        select: { id: true, name: true, slug: true },
                    },
                    brand: {
                        select: { id: true, name: true },
                    },
                    options: {
                        select: {
                            name: true,
                            values: {
                                select: { value: true },
                            },
                        },
                        orderBy: { displayOrder: 'asc' },
                    },
                    skus: {
                        take: 1,
                        where: {
                            status: 'ACTIVE',
                            price: { gt: 0 }
                        },
                        orderBy: { price: 'asc' },
                        select: {
                            price: true,
                            salePrice: true,
                            imageUrl: true,
                        },
                    },
                },
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                brand: true,
                options: {
                    include: { values: true },
                    orderBy: { displayOrder: 'asc' },
                },
                skus: {
                    include: {
                        optionValues: {
                            include: { optionValue: { include: { option: true } } },
                        },
                    },
                },
            },
        });
        if (!product)
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        return product;
    }
    async update(id, updateProductDto) {
        const { options, ...data } = updateProductDto;
        const product = await this.prisma.product.update({
            where: { id },
            data: data,
            include: { options: { include: { values: true } } },
        });
        if (options) {
            await this.prisma.$transaction(async (tx) => {
                await tx.productOption.deleteMany({ where: { productId: id } });
                if (options.length > 0) {
                    await tx.product.update({
                        where: { id },
                        data: {
                            options: {
                                create: options.map((opt, index) => ({
                                    name: opt.name,
                                    displayOrder: index,
                                    values: {
                                        create: opt.values.map((val) => ({ value: val })),
                                    },
                                })),
                            },
                        },
                    });
                }
            });
        }
        const freshProduct = await this.prisma.product.findUnique({
            where: { id },
            include: { options: { include: { values: true } } },
        });
        if (freshProduct &&
            freshProduct.options &&
            freshProduct.options.length > 0) {
            const optionValues = freshProduct.options.map((opt) => opt.values);
            const combinations = this.cartesian(optionValues);
            const validSkuCodes = new Set();
            for (const combo of combinations) {
                const variantSuffix = combo
                    .map((v) => (0, slugify_1.default)(v.value, { lower: true }))
                    .join('-');
                const skuCode = `${freshProduct.slug}-${variantSuffix}`.toUpperCase();
                validSkuCodes.add(skuCode);
                const existingSku = await this.prisma.sku.findUnique({
                    where: { skuCode },
                });
                if (!existingSku) {
                    await this.prisma.sku.create({
                        data: {
                            skuCode,
                            productId: id,
                            price: 0,
                            stock: 0,
                            status: 'ACTIVE',
                            optionValues: {
                                create: combo.map((val) => ({
                                    optionValueId: val.id,
                                })),
                            },
                        },
                    });
                }
                else {
                    await this.prisma.sku.update({
                        where: { id: existingSku.id },
                        data: { status: 'ACTIVE' },
                    });
                    await this.prisma.skuToOptionValue.deleteMany({
                        where: { skuId: existingSku.id },
                    });
                    await this.prisma.skuToOptionValue.createMany({
                        data: combo.map((val) => ({
                            skuId: existingSku.id,
                            optionValueId: val.id,
                        })),
                    });
                }
            }
            await this.prisma.sku.updateMany({
                where: {
                    productId: id,
                    skuCode: { notIn: Array.from(validSkuCodes) },
                },
                data: { status: 'INACTIVE' },
            });
        }
        else if (freshProduct) {
            const defaultSkuCode = `${freshProduct.slug}-DEFAULT`.toUpperCase();
            const existingDefault = await this.prisma.sku.findUnique({
                where: { skuCode: defaultSkuCode },
            });
            if (!existingDefault) {
                await this.prisma.sku.create({
                    data: {
                        skuCode: defaultSkuCode,
                        productId: id,
                        price: 0,
                        stock: 0,
                        status: 'ACTIVE',
                    },
                });
            }
            else {
                await this.prisma.sku.update({
                    where: { id: existingDefault.id },
                    data: { status: 'ACTIVE' },
                });
            }
            await this.prisma.sku.updateMany({
                where: {
                    productId: id,
                    skuCode: { not: defaultSkuCode },
                },
                data: { status: 'INACTIVE' },
            });
        }
        return freshProduct;
    }
    async remove(id) {
        return this.prisma.product.delete({ where: { id } });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map