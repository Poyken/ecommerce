import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  recipientName: z.string().min(1).describe('John Doe'),
  phoneNumber: z.string().min(1).describe('0987654321'),
  shippingAddress: z.string().min(1).describe('123 Main St, Hanoi'),
  paymentMethod: z.string().optional().describe('COD'),
  shippingCity: z.string().optional().describe('Hanoi'),
  shippingDistrict: z.string().optional().describe('Hoan Kiem'),
  shippingWard: z.string().optional().describe('Hang Bac'),
  shippingPhone: z.string().optional().describe('0987654321'),
  // itemIds: z.array(z.string()).optional().describe('["item-uuid-1"]'),
  items: z
    .array(
      z.object({
        skuId: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
        productId: z.string(),
        skuName: z.string(),
        productName: z.string(),
      }),
    )
    .min(1),
  couponCode: z.string().optional().describe('SUMMER2025'),
  returnUrl: z.string().optional().describe('http://localhost:3000/orders'),
  addressId: z.string().optional().describe('address-uuid'),
});

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
