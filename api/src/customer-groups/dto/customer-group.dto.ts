import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// =====================================================================
// CUSTOMER GROUP DTOs
// =====================================================================

const CreateCustomerGroupSchema = z.object({
  name: z.string().min(1).describe('Tên nhóm (VIP, Bán buôn, Đại lý C1)'),
  description: z.string().optional(),
  priceListId: z.string().optional().describe('ID bảng giá áp dụng'),
});
export class CreateCustomerGroupDto extends createZodDto(
  CreateCustomerGroupSchema,
) {}

export class UpdateCustomerGroupDto extends createZodDto(
  CreateCustomerGroupSchema.partial(),
) {}

// =====================================================================
// PRICE LIST DTOs
// =====================================================================

const PriceListItemSchema = z.object({
  skuId: z.string(),
  price: z.number().describe('Giá áp dụng'),
  compareAtPrice: z.number().optional().describe('Giá gốc (gạch ngang)'),
});
export class PriceListItemDto extends createZodDto(PriceListItemSchema) {}

const CreatePriceListSchema = z.object({
  name: z.string().min(1).describe('Tên bảng giá (VD: Bảng giá đại lý)'),
  currency: z.string().optional().describe('Đơn vị tiền tệ (VND)'),
  isDefault: z.boolean().optional().describe('Là bảng giá mặc định?'),
  isActive: z.boolean().optional().describe('Đang kích hoạt?'),
  startDate: z.string().datetime().optional().describe('Ngày bắt đầu áp dụng'),
  endDate: z.string().datetime().optional().describe('Ngày kết thúc'),
  items: z.array(PriceListItemSchema).optional().describe('Danh sách giá SKU'),
});
export class CreatePriceListDto extends createZodDto(CreatePriceListSchema) {}

export class UpdatePriceListDto extends createZodDto(
  CreatePriceListSchema.partial(),
) {}

const AddPriceListItemSchema = z.object({
  skuId: z.string(),
  price: z.number(),
  compareAtPrice: z.number().optional(),
});
export class AddPriceListItemDto extends createZodDto(AddPriceListItemSchema) {}

// =====================================================================
// PRICING QUERY DTOs
// =====================================================================

const GetPricesSchema = z.object({
  skuIds: z.array(z.string()),
});
export class GetPricesDto extends createZodDto(GetPricesSchema) {}
