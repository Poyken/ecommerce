import { CreatePaymentDto, PaymentResult, PaymentStrategy } from '../interfaces/payment-strategy.interface';
export declare class MockStripeStrategy implements PaymentStrategy {
    private readonly logger;
    processPayment(dto: CreatePaymentDto): Promise<PaymentResult>;
}
