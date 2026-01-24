import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateAddressSchema = z.object({
  recipientName: z.string().min(1).describe('John Doe'),
  phoneNumber: z.string().min(1).describe('0987654321'),
  street: z.string().min(1).describe('123 Main St'),
  city: z.string().min(1).describe('Hanoi'),
  district: z.string().min(1).describe('Ba Dinh'),
  ward: z.string().optional().describe('Lieu Giai'),
  postalCode: z.string().optional().describe('100000'),
  country: z.string().optional().describe('Vietnam'),
  isDefault: z.boolean().optional().describe('Set default'),
  districtId: z.number().optional(),
  provinceId: z.number().optional(),
  wardCode: z.string().optional(),
});

export class CreateAddressDto extends createZodDto(CreateAddressSchema) {}
