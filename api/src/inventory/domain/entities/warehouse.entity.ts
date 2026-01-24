/**
 * =====================================================================
 * WAREHOUSE ENTITY - Domain Layer
 * =====================================================================
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface WarehouseProps extends EntityProps {
  tenantId: string;
  name: string;
  address?: string;
  isDefault: boolean;
}

export class Warehouse extends BaseEntity<WarehouseProps> {
  private constructor(props: WarehouseProps) {
    super(props);
  }

  static create(props: {
    id: string;
    tenantId: string;
    name: string;
    address?: string;
    isDefault?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Warehouse {
    return new Warehouse({
      ...props,
      isDefault: props.isDefault ?? false,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromPersistence(props: WarehouseProps): Warehouse {
    return new Warehouse(props);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  updateInfo(props: {
    name?: string;
    address?: string;
    isDefault?: boolean;
  }): void {
    if (props.name) this.props.name = props.name;
    if (props.address !== undefined) this.props.address = props.address;
    if (props.isDefault !== undefined) this.props.isDefault = props.isDefault;
    this.touch();
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      address: this.address,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
