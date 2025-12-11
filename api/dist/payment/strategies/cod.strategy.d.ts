import { CreatePaymentDto, PaymentResult, PaymentStrategy } from '../interfaces/payment-strategy.interface';
export declare class CodPaymentStrategy implements PaymentStrategy {
    processPayment(dto: CreatePaymentDto): Promise<PaymentResult>;
}
