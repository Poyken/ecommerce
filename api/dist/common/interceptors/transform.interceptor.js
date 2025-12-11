"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformInterceptor = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
const operators_1 = require("rxjs/operators");
let TransformInterceptor = class TransformInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => {
            const responseData = data?.data || data;
            const meta = data?.meta;
            const message = data?.message || 'Success';
            return {
                statusCode: context.switchToHttp().getResponse().statusCode,
                message,
                data: this.transformData(responseData),
                meta,
            };
        }));
    }
    transformData(data) {
        if (data === null || data === undefined) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map((item) => this.transformData(item));
        }
        if (this.isDecimal(data)) {
            return Number(data);
        }
        if (typeof data === 'object') {
            if (data instanceof Date) {
                return data;
            }
            const transformed = {};
            for (const key of Object.keys(data)) {
                transformed[key] = this.transformData(data[key]);
            }
            return transformed;
        }
        return data;
    }
    isDecimal(value) {
        return (value instanceof library_1.Decimal ||
            (value &&
                typeof value === 'object' &&
                's' in value &&
                'e' in value &&
                'd' in value));
    }
};
exports.TransformInterceptor = TransformInterceptor;
exports.TransformInterceptor = TransformInterceptor = __decorate([
    (0, common_1.Injectable)()
], TransformInterceptor);
//# sourceMappingURL=transform.interceptor.js.map