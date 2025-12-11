"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MockStripeStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockStripeStrategy = void 0;
const common_1 = require("@nestjs/common");
let MockStripeStrategy = MockStripeStrategy_1 = class MockStripeStrategy {
    logger = new common_1.Logger(MockStripeStrategy_1.name);
    processPayment(dto) {
        this.logger.log(`Đang xử lý thanh toán Mock Stripe cho Đơn hàng ${dto.orderId}, Số tiền: ${dto.amount}`);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: `STRIPE_MOCK_${Date.now()}`,
                    message: 'Thanh toán được ủy quyền qua Mock Stripe',
                });
            }, 500);
        });
    }
};
exports.MockStripeStrategy = MockStripeStrategy;
exports.MockStripeStrategy = MockStripeStrategy = MockStripeStrategy_1 = __decorate([
    (0, common_1.Injectable)()
], MockStripeStrategy);
//# sourceMappingURL=mock-stripe.strategy.js.map