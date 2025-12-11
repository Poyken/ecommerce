import { CreatePaymentDto } from './interfaces/payment-strategy.interface';
import { CodPaymentStrategy } from './strategies/cod.strategy';
import { MockStripeStrategy } from './strategies/mock-stripe.strategy';
export declare class PaymentService {
    private readonly codStrategy;
    private readonly mockStripeStrategy;
    private strategies;
    constructor(codStrategy: CodPaymentStrategy, mockStripeStrategy: MockStripeStrategy);
    processPayment(method: string, details: CreatePaymentDto): Promise<import("./interfaces/payment-strategy.interface").PaymentResult>;
}
