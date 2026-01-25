export class OrderPlacedEvent {
  constructor(
    public readonly orderId: string,
    public readonly tenantId: string,
    public readonly items: Array<{
      skuId: string;
      quantity: number;
    }>,
    public readonly userId: string,
  ) {}
}
