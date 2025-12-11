export interface CreatePaymentDto {
    amount: number;
    orderId: string;
    orderDescription?: string;
    paymentToken?: string;
    returnUrl?: string;
    ipAddr?: string;
}
export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    paymentUrl?: string;
    message?: string;
    rawResponse?: any;
}
export interface PaymentStrategy {
    processPayment(dto: CreatePaymentDto): Promise<PaymentResult>;
}
