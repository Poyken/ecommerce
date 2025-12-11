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
exports.UserEntity = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class UserEntity {
    id;
    email;
    firstName;
    lastName;
    password;
    roles;
    permissions;
    createdAt;
    updatedAt;
    constructor(partial) {
        Object.assign(this, partial);
        this.roles = partial?.roles;
        this.permissions = partial?.permissions;
    }
    get flattenedRoles() {
        if (!this.roles || !Array.isArray(this.roles))
            return [];
        return this.roles
            .map((r) => {
            const roleName = r.role?.name || r.name || r;
            return typeof roleName === 'string' ? roleName : null;
        })
            .filter((r) => Boolean(r));
    }
    get flattenedPermissions() {
        const directPerms = this.permissions && Array.isArray(this.permissions)
            ? this.permissions
                .map((p) => p.permission?.name || p.name || p)
                .filter((p) => typeof p === 'string')
            : [];
        let rolePerms = [];
        if (this.roles && Array.isArray(this.roles)) {
            rolePerms = this.roles
                .flatMap((ur) => ur.role?.permissions?.map((rp) => rp.permission?.name) || [])
                .filter(Boolean);
        }
        return [...new Set([...directPerms, ...rolePerms])];
    }
}
exports.UserEntity = UserEntity;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserEntity.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserEntity.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserEntity.prototype, "lastName", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], UserEntity.prototype, "password", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Array)
], UserEntity.prototype, "roles", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Array)
], UserEntity.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], UserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], UserEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_transformer_1.Expose)({ name: 'roles' }),
    __metadata("design:type", Array),
    __metadata("design:paramtypes", [])
], UserEntity.prototype, "flattenedRoles", null);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_transformer_1.Expose)({ name: 'permissions' }),
    __metadata("design:type", Array),
    __metadata("design:paramtypes", [])
], UserEntity.prototype, "flattenedPermissions", null);
//# sourceMappingURL=user.entity.js.map