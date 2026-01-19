import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PurchaseOrderStatus } from '@prisma/client';

const CreateSupplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
export class CreateSupplierDto extends createZodDto(CreateSupplierSchema) {}

export class UpdateSupplierDto extends createZodDto(CreateSupplierSchema) {}

const CreatePurchaseOrderItemSchema = z.object({
  skuId: z.string().min(1),
  quantity: z.number().min(1),
  costPrice: z.number().min(0),
});
export class CreatePurchaseOrderItemDto extends createZodDto(
  CreatePurchaseOrderItemSchema,
) {}

const CreatePurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(CreatePurchaseOrderItemSchema),
});
export class CreatePurchaseOrderDto extends createZodDto(
  CreatePurchaseOrderSchema,
) {}

const UpdatePurchaseOrderStatusSchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus),
});
export class UpdatePurchaseOrderStatusDto extends createZodDto(
  UpdatePurchaseOrderStatusSchema,
) {}
