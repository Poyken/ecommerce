"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodPaymentStrategy = void 0;
const common_1 = require("@nestjs/common");
let CodPaymentStrategy = class CodPaymentStrategy {
    processPayment(dto) {
        return Promise.resolve({
            success: true,
            message: 'Đặt hàng thành công với hình thức Thanh toán khi nhận hàng (COD).',
            transactionId: `COD-${Date.now()}-${dto.orderId}`,
        });
    }
};
exports.CodPaymentStrategy = CodPaymentStrategy;
exports.CodPaymentStrategy = CodPaymentStrategy = __decorate([
    (0, common_1.Injectable)()
], CodPaymentStrategy);
//# sourceMappingURL=cod.strategy.js.map