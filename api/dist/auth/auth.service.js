"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const user_entity_1 = require("./entities/user.entity");
const token_service_1 = require("./token.service");
let AuthService = class AuthService {
    prisma;
    tokenService;
    redisService;
    constructor(prisma, tokenService, redisService) {
        this.prisma = prisma;
        this.tokenService = tokenService;
        this.redisService = redisService;
    }
    async register(dto) {
        const { email, password, firstName, lastName } = dto;
        const existsUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existsUser) {
            throw new common_1.ConflictException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
            },
        });
        const { accessToken, refreshToken } = this.tokenService.generateTokens(user.id);
        await this.redisService.set(`refreshToken:${user.id}`, refreshToken, 'EX', this.tokenService.getRefreshTokenExpirationTime());
        return { accessToken, refreshToken };
    }
    async login(dto) {
        const { email, password } = dto;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                permissions: { include: { permission: true } },
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: { include: { permission: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const directPerms = user.permissions.map((up) => up.permission.name);
        const rolePerms = user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.name));
        const allPermissions = [...new Set([...directPerms, ...rolePerms])];
        const { accessToken, refreshToken } = this.tokenService.generateTokens(user.id, allPermissions);
        await this.redisService.set(`refreshToken:${user.id}`, refreshToken, 'EX', this.tokenService.getRefreshTokenExpirationTime());
        return {
            accessToken,
            refreshToken,
        };
    }
    async logout(userId) {
        await this.redisService.del(`refreshToken:${userId}`);
        return { message: 'Logged out successfully' };
    }
    async refreshTokens(refreshToken) {
        const decoded = this.tokenService.validateRefreshToken(refreshToken);
        if (!decoded || !decoded.userId) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const userId = decoded.userId;
        const storedToken = await this.redisService.get(`refreshToken:${userId}`);
        if (!storedToken || storedToken !== refreshToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                permissions: { include: { permission: true } },
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: { include: { permission: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const directPerms = user.permissions.map((up) => up.permission.name);
        const rolePerms = user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.name));
        const allPermissions = [...new Set([...directPerms, ...rolePerms])];
        const tokens = this.tokenService.generateTokens(userId, allPermissions);
        await this.redisService.set(`refreshToken:${userId}`, tokens.refreshToken, 'EX', this.tokenService.getRefreshTokenExpirationTime());
        return tokens;
    }
    async updateProfile(userId, dto) {
        const { roles, email, password, newPassword, ...updateData } = dto;
        if (password && newPassword) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user)
                throw new common_1.UnauthorizedException('User not found');
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Mật khẩu hiện tại không đúng');
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await this.prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });
        }
        if (Object.keys(updateData).length > 0) {
            return this.prisma.user.update({
                where: { id: userId },
                data: updateData,
            });
        }
        return { success: true };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                permissions: { include: { permission: true } },
                addresses: true,
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: { include: { permission: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return new user_entity_1.UserEntity(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        token_service_1.TokenService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map