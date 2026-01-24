import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentProps extends EntityProps {
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  providerTransactionId?: string;
  metadata?: any;
  paidAt?: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment extends BaseEntity<PaymentProps> {
  private constructor(props: PaymentProps) {
    super(props);
  }

  static create(props: {
    id: string;
    orderId: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    tenantId: string;
  }): Payment {
    return new Payment({
      ...props,
      currency: props.currency || 'VND',
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }

  static fromPersistence(props: PaymentProps): Payment {
    return new Payment(props);
  }

  markAsPaid(providerTransactionId?: string, metadata?: any): void {
    this.props.status = PaymentStatus.PAID;
    this.props.providerTransactionId = providerTransactionId;
    this.props.metadata = metadata;
    this.props.paidAt = new Date();
    this.touch();
  }

  markAsFailed(metadata?: any): void {
    this.props.status = PaymentStatus.FAILED;
    this.props.metadata = metadata;
    this.touch();
  }

  get orderId(): string {
    return this.props.orderId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get status(): PaymentStatus {
    return this.props.status;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }

  toPersistence(): Record<string, any> {
    return {
      ...this.props,
      id: this.id,
    };
  }
}
