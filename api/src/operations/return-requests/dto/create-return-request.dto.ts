import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export enum ReturnType {
  REFUND_ONLY = 'REFUND_ONLY',
  RETURN_AND_REFUND = 'RETURN_AND_REFUND',
  EXCHANGE = 'EXCHANGE',
}

export enum ReturnMethod {
  AT_COUNTER = 'AT_COUNTER',
  PICKUP = 'PICKUP',
  SELF_SHIP = 'SELF_SHIP',
}

export enum RefundMethod {
  ORIGINAL_PAYMENT = 'ORIGINAL_PAYMENT',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

const ReturnItemSchema = z.object({
  orderItemId: z.string().uuid().describe('ID của OrderItem cần trả'),
  quantity: z.number().int().min(1).describe('Số lượng trả'),
});
class ReturnItemDto extends createZodDto(ReturnItemSchema) {}

const BankAccountSchema = z.object({
  bankName: z.string().describe('Tên ngân hàng'),
  number: z.string().describe('Số tài khoản'),
  owner: z.string().describe('Chủ tài khoản'),
});
class BankAccountDto extends createZodDto(BankAccountSchema) {}

export const CreateReturnRequestSchema = z.object({
  orderId: z.string().uuid().describe('ID đơn hàng cần đổi trả'),
  reason: z.string().describe('Lý do đổi trả'),
  description: z.string().optional().describe('Mô tả chi tiết'),
  type: z.nativeEnum(ReturnType).describe('Loại yêu cầu'),
  returnMethod: z.nativeEnum(ReturnMethod).describe('Phương thức gửi trả'),
  pickupAddress: z
    .record(z.string(), z.any())
    .optional()
    .describe('Địa chỉ lấy hàng (nếu chọn PICKUP)'),
  refundMethod: z.nativeEnum(RefundMethod).describe('Phương thức hoàn tiền'),
  bankAccount: BankAccountSchema.optional().describe(
    'Thông tin tài khoản ngân hàng (nếu chọn BANK_TRANSFER)',
  ),
  refundAmount: z.number().optional().describe('Số tiền hoàn lại dự kiến'),
  images: z.array(z.string()).describe('Danh sách ảnh bằng chứng (URLs)'),
  items: z.array(ReturnItemSchema).describe('Danh sách sản phẩm cần trả'),
});

export class CreateReturnRequestDto extends createZodDto(
  CreateReturnRequestSchema,
) {}
