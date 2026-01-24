/**
 * =====================================================================
 * INVENTORY LOG ENTITY - Domain Layer
 * =====================================================================
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface InventoryLogProps extends EntityProps {
  tenantId: string;
  skuId: string;
  changeAmount: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId?: string;
}

export class InventoryLog extends BaseEntity<InventoryLogProps> {
  private constructor(props: InventoryLogProps) {
    super(props);
  }

  static create(props: {
    id: string;
    tenantId: string;
    skuId: string;
    changeAmount: number;
    previousStock: number;
    newStock: number;
    reason: string;
    userId?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): InventoryLog {
    return new InventoryLog({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromPersistence(props: InventoryLogProps): InventoryLog {
    return new InventoryLog(props);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get skuId(): string {
    return this.props.skuId;
  }

  get changeAmount(): number {
    return this.props.changeAmount;
  }

  get previousStock(): number {
    return this.props.previousStock;
  }

  get newStock(): number {
    return this.props.newStock;
  }

  get reason(): string {
    return this.props.reason;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      skuId: this.skuId,
      changeAmount: this.changeAmount,
      previousStock: this.previousStock,
      newStock: this.newStock,
      reason: this.reason,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
