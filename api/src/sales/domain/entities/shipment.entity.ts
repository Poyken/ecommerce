/**
 * =====================================================================
 * SHIPMENT AGGREGATE - Domain Layer
 * =====================================================================
 */

import { AggregateRoot, EntityProps } from '@core/domain/entities/base.entity';

export enum ShipmentStatus {
  PENDING = 'PENDING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export interface ShipmentItemProps {
  id: string;
  orderItemId: string;
  quantity: number;
}

export interface ShipmentProps extends EntityProps {
  tenantId: string;
  orderId: string;
  status: ShipmentStatus;
  carrier?: string;
  trackingCode?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  items: ShipmentItemProps[];
}

export class Shipment extends AggregateRoot<ShipmentProps> {
  private constructor(props: ShipmentProps) {
    super(props);
  }

  static create(props: {
    id: string;
    tenantId: string;
    orderId: string;
    carrier?: string;
    trackingCode?: string;
    items: ShipmentItemProps[];
    status?: ShipmentStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): Shipment {
    return new Shipment({
      ...props,
      status: props.status ?? ShipmentStatus.PENDING,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromPersistence(props: ShipmentProps): Shipment {
    return new Shipment(props);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get status(): ShipmentStatus {
    return this.props.status;
  }
  get carrier(): string | undefined {
    return this.props.carrier;
  }
  get trackingCode(): string | undefined {
    return this.props.trackingCode;
  }
  get shippedAt(): Date | undefined {
    return this.props.shippedAt;
  }
  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }
  get items(): readonly ShipmentItemProps[] {
    return Object.freeze([...this.props.items]);
  }

  updateStatus(newStatus: ShipmentStatus): void {
    this.props.status = newStatus;
    if (newStatus === ShipmentStatus.SHIPPED && !this.props.shippedAt) {
      this.props.shippedAt = new Date();
    }
    if (newStatus === ShipmentStatus.DELIVERED && !this.props.deliveredAt) {
      this.props.deliveredAt = new Date();
    }
    this.touch();
  }

  setTrackingInfo(carrier: string, trackingCode: string): void {
    this.props.carrier = carrier;
    this.props.trackingCode = trackingCode;
    this.touch();
  }

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      orderId: this.orderId,
      status: this.status,
      carrier: this.carrier,
      trackingCode: this.trackingCode,
      shippedAt: this.shippedAt,
      deliveredAt: this.deliveredAt,
      items: this.items,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
