import { Payment } from '../entities/payment.entity';

export interface IPaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  findByProviderTransactionId(id: string): Promise<Payment | null>;
}

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';
