import { Shipment } from '../entities/shipment.entity';

export const SHIPMENT_REPOSITORY = 'SHIPMENT_REPOSITORY';

export abstract class IShipmentRepository {
  abstract findById(id: string): Promise<Shipment | null>;
  abstract findByOrderId(orderId: string): Promise<Shipment[]>;
  abstract findByTrackingCode(trackingCode: string): Promise<Shipment | null>;
  abstract save(shipment: Shipment): Promise<Shipment>;
  abstract delete(id: string): Promise<void>;
}
