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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService extends ioredis_1.default {
    logger = new common_1.Logger(RedisService_1.name);
    constructor() {
        super(process.env.REDIS_URL || '', {
            tls: process.env.NODE_ENV === 'production'
                ? {
                    rejectUnauthorized: false,
                }
                : undefined,
            retryStrategy: (times) => {
                const maxRetry = 10;
                if (times > maxRetry) {
                    console.error('Redis: Giving up after 10 retries');
                    return null;
                }
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
    }
    onModuleInit() {
        this.on('connect', () => {
            this.logger.log('Redis đã kết nối thành công');
        });
        this.on('error', (err) => {
            this.logger.error('Kết nối Redis thất bại', err);
        });
    }
    onModuleDestroy() {
        this.disconnect();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map