import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateWarehouseSchema = z.object({
  name: z.string().min(1).describe('Tên kho (VD: Kho Hà Nội)'),
  address: z.string().optional().describe('Địa chỉ kho'),
  isDefault: z
    .boolean()
    .optional()
    .default(false)
    .describe('Có phải kho mặc định không'),
});
export class CreateWarehouseDto extends createZodDto(CreateWarehouseSchema) {}

const UpdateStockSchema = z.object({
  warehouseId: z.string().min(1).describe('ID kho'),
  skuId: z.string().min(1).describe('ID SKU'),
  quantity: z.number().int().describe('Số lượng thay đổi (+ nhập, - xuất)'),
  reason: z.string().min(1).describe('Lý do thay đổi stock'),
});
export class UpdateStockDto extends createZodDto(UpdateStockSchema) {}

const TransferStockSchema = z.object({
  fromWarehouseId: z.string().min(1).describe('ID kho nguồn'),
  toWarehouseId: z.string().min(1).describe('ID kho đích'),
  skuId: z.string().min(1).describe('ID SKU'),
  quantity: z.number().int().min(1).describe('Số lượng chuyển'),
  reason: z.string().optional().describe('Ghi chú chuyển kho'),
});
export class TransferStockDto extends createZodDto(TransferStockSchema) {}
