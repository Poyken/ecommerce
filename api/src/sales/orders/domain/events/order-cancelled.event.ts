export class OrderCancelledEvent {
  constructor(
    public readonly orderId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly items: Array<{
      skuId: string;
      quantity: number;
    }>,
    public readonly reason?: string,
  ) {}
}
