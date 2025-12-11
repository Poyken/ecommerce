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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const assign_permissions_dto_1 = require("./dto/assign-permissions.dto");
const create_permission_dto_1 = require("./dto/create-permission.dto");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_permission_dto_1 = require("./dto/update-permission.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const roles_service_1 = require("./roles.service");
let RolesController = class RolesController {
    rolesService;
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    create(createRoleDto) {
        return this.rolesService.create(createRoleDto);
    }
    findAll(search) {
        return this.rolesService.findAll(search);
    }
    getAllPermissions() {
        return this.rolesService.getAllPermissions();
    }
    createPermission(dto) {
        return this.rolesService.createPermission(dto);
    }
    updatePermission(id, dto) {
        return this.rolesService.updatePermission(id, dto);
    }
    deletePermission(id) {
        return this.rolesService.deletePermission(id);
    }
    findOne(id) {
        return this.rolesService.findOne(id);
    }
    update(id, updateRoleDto) {
        return this.rolesService.update(id, updateRoleDto);
    }
    remove(id) {
        return this.rolesService.remove(id);
    }
    assignPermissions(id, dto) {
        return this.rolesService.assignPermissions(id, dto);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('role:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo vai trò mới' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('role:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy tất cả vai trò' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy tất cả quyền hạn' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "getAllPermissions", null);
__decorate([
    (0, common_1.Post)('permissions'),
    (0, permissions_decorator_1.Permissions)('permission:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo quyền hạn mới' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_permission_dto_1.CreatePermissionDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Patch)('permissions/:id'),
    (0, permissions_decorator_1.Permissions)('permission:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật quyền hạn' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_permission_dto_1.UpdatePermissionDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "updatePermission", null);
__decorate([
    (0, common_1.Delete)('permissions/:id'),
    (0, permissions_decorator_1.Permissions)('permission:delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa quyền hạn' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "deletePermission", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('role:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết vai trò' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('role:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật vai trò' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('role:delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa vai trò' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/permissions'),
    (0, permissions_decorator_1.Permissions)('role:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Gán quyền hạn cho vai trò' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Đã gán quyền hạn thành công.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_permissions_dto_1.AssignPermissionsDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignPermissions", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('Roles (Admin)'),
    (0, common_1.Controller)('roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map