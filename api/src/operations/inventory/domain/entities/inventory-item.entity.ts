/**
 * =====================================================================
 * INVENTORY ITEM ENTITY - Domain Layer
 * =====================================================================
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';
import { BusinessRuleViolationError } from '@core/domain/errors/domain.error';

export interface InventoryItemProps extends EntityProps {
  tenantId: string;
  warehouseId: string;
  skuId: string;
  quantity: number;
  minStockLevel: number;
}

export class InventoryItem extends BaseEntity<InventoryItemProps> {
  private constructor(props: InventoryItemProps) {
    super(props);
  }

  static create(props: {
    id: string;
    tenantId: string;
    warehouseId: string;
    skuId: string;
    quantity?: number;
    minStockLevel?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): InventoryItem {
    return new InventoryItem({
      ...props,
      quantity: props.quantity ?? 0,
      minStockLevel: props.minStockLevel ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromPersistence(props: InventoryItemProps): InventoryItem {
    return new InventoryItem(props);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get warehouseId(): string {
    return this.props.warehouseId;
  }

  get skuId(): string {
    return this.props.skuId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get minStockLevel(): number {
    return this.props.minStockLevel;
  }

  get isLowStock(): boolean {
    return this.props.quantity <= this.props.minStockLevel;
  }

  adjustQuantity(amount: number): void {
    const newQuantity = this.props.quantity + amount;
    if (newQuantity < 0) {
      throw new BusinessRuleViolationError(
        `Insufficient stock for SKU ${this.skuId} in warehouse ${this.warehouseId}. Current: ${this.props.quantity}, Requested adjustment: ${amount}`,
      );
    }
    this.props.quantity = newQuantity;
    this.touch();
  }

  updateMinStockLevel(level: number): void {
    if (level < 0) {
      throw new BusinessRuleViolationError(
        'Minimum stock level cannot be negative',
      );
    }
    this.props.minStockLevel = level;
    this.touch();
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      warehouseId: this.warehouseId,
      skuId: this.skuId,
      quantity: this.quantity,
      minStockLevel: this.minStockLevel,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
