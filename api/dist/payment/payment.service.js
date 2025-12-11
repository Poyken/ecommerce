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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const cod_strategy_1 = require("./strategies/cod.strategy");
const mock_stripe_strategy_1 = require("./strategies/mock-stripe.strategy");
let PaymentService = class PaymentService {
    codStrategy;
    mockStripeStrategy;
    strategies = new Map();
    constructor(codStrategy, mockStripeStrategy) {
        this.codStrategy = codStrategy;
        this.mockStripeStrategy = mockStripeStrategy;
        this.strategies.set('COD', codStrategy);
        this.strategies.set('CREDIT_CARD', mockStripeStrategy);
    }
    async processPayment(method, details) {
        const strategy = this.strategies.get(method.toUpperCase());
        if (!strategy) {
            throw new common_1.BadRequestException(`Phương thức thanh toán ${method} không được hỗ trợ.`);
        }
        return strategy.processPayment(details);
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cod_strategy_1.CodPaymentStrategy,
        mock_stripe_strategy_1.MockStripeStrategy])
], PaymentService);
//# sourceMappingURL=payment.service.js.map