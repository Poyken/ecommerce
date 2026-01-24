export class PaymentSuccessfulEvent {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly providerTransactionId?: string,
  ) {}
}
