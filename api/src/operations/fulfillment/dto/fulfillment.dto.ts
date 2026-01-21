import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ShipmentStatus } from '@prisma/client';

const ShipmentItemSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().min(1),
});
export class ShipmentItemDto extends createZodDto(ShipmentItemSchema) {}

const CreateShipmentSchema = z.object({
  orderId: z.string().min(1),
  carrier: z.string().optional(),
  trackingCode: z.string().optional(),
  items: z.array(ShipmentItemSchema),
});
export class CreateShipmentDto extends createZodDto(CreateShipmentSchema) {}

const UpdateShipmentStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
});
export class UpdateShipmentStatusDto extends createZodDto(
  UpdateShipmentStatusSchema,
) {}
