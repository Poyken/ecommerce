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
exports.SkusController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_decorator_1 = require("../../auth/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permissions_guard_1 = require("../../auth/permissions.guard");
const create_sku_dto_1 = require("./dto/create-sku.dto");
const update_sku_dto_1 = require("./dto/update-sku.dto");
const skus_service_1 = require("./skus.service");
let SkusController = class SkusController {
    skusService;
    constructor(skusService) {
        this.skusService = skusService;
    }
    create(createSkuDto) {
        return this.skusService.create(createSkuDto);
    }
    findAll(page = 1, limit = 10, status) {
        return this.skusService.findAll(Number(page), Number(limit), status);
    }
    findOne(id) {
        return this.skusService.findOne(id);
    }
    update(id, updateSkuDto) {
        return this.skusService.update(id, updateSkuDto);
    }
    remove(id) {
        return this.skusService.remove(id);
    }
};
exports.SkusController = SkusController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('product:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo SKU mới (Biến thể)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sku_dto_1.CreateSkuDto]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách SKU' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
    }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết SKU' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('product:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật thông tin SKU (Giá, Tồn kho...)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_sku_dto_1.UpdateSkuDto]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.Permissions)('product:delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa SKU' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SkusController.prototype, "remove", null);
exports.SkusController = SkusController = __decorate([
    (0, swagger_1.ApiTags)('Product SKUs'),
    (0, common_1.Controller)('skus'),
    __metadata("design:paramtypes", [skus_service_1.SkusService])
], SkusController);
//# sourceMappingURL=skus.controller.js.map