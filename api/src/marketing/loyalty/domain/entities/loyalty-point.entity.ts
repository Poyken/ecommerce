/**
 * =====================================================================
 * LOYALTY POINT ENTITY - Domain Layer
 * =====================================================================
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export enum LoyaltyPointType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  REFUNDED = 'REFUNDED',
}

export interface LoyaltyPointProps extends EntityProps {
  tenantId: string;
  userId: string;
  orderId?: string;
  amount: number;
  type: LoyaltyPointType;
  reason?: string;
  expiresAt?: Date;
}

export class LoyaltyPoint extends BaseEntity<LoyaltyPointProps> {
  private constructor(props: LoyaltyPointProps) {
    super(props);
  }

  static create(props: {
    id: string;
    tenantId: string;
    userId: string;
    orderId?: string;
    amount: number;
    type: LoyaltyPointType;
    reason?: string;
    expiresAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }): LoyaltyPoint {
    return new LoyaltyPoint({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromPersistence(props: LoyaltyPointProps): LoyaltyPoint {
    return new LoyaltyPoint(props);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get orderId(): string | undefined {
    return this.props.orderId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get type(): LoyaltyPointType {
    return this.props.type;
  }
  get reason(): string | undefined {
    return this.props.reason;
  }
  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      userId: this.userId,
      orderId: this.orderId,
      amount: this.amount,
      type: this.type,
      reason: this.reason,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
