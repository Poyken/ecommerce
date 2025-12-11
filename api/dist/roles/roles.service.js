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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createRoleDto) {
        const existing = await this.prisma.role.findUnique({
            where: { name: createRoleDto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Role này đã tồn tại');
        }
        return this.prisma.role.create({ data: createRoleDto });
    }
    async findAll(search) {
        const where = search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {};
        return this.prisma.role.findMany({
            where,
            include: {
                permissions: { select: { permission: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: { select: { permission: true } },
            },
        });
        if (!role)
            throw new common_1.NotFoundException('Không tìm thấy Role');
        return role;
    }
    async update(id, updateRoleDto) {
        return this.prisma.role.update({
            where: { id },
            data: updateRoleDto,
        });
    }
    async remove(id) {
        return this.prisma.role.delete({ where: { id } });
    }
    async assignPermissions(id, dto) {
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (!role)
            throw new common_1.NotFoundException('Không tìm thấy Role');
        const permissions = await this.prisma.permission.findMany({
            where: { id: { in: dto.permissions } },
        });
        if (permissions.length !== dto.permissions.length) {
            throw new common_1.BadRequestException('Một số Permission không tồn tại');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({
                where: { roleId: id },
            });
            const data = permissions.map((p) => ({
                roleId: id,
                permissionId: p.id,
            }));
            await tx.rolePermission.createMany({ data });
            return tx.role.findUnique({
                where: { id },
                include: { permissions: { include: { permission: true } } },
            });
        });
    }
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async createPermission(dto) {
        const existing = await this.prisma.permission.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Permission này đã tồn tại');
        }
        return this.prisma.permission.create({ data: dto });
    }
    async updatePermission(id, dto) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Không tìm thấy Permission');
        }
        return this.prisma.permission.update({
            where: { id },
            data: dto,
        });
    }
    async deletePermission(id) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Không tìm thấy Permission');
        }
        return this.prisma.permission.delete({ where: { id } });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map