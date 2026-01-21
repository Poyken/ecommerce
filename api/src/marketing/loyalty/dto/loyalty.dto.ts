import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Local enum to bypass stale Prisma client types
export enum LoyaltyPointType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  REFUNDED = 'REFUNDED',
}

const EarnPointsSchema = z.object({
  userId: z.string().min(1).describe('ID người dùng'),
  orderId: z.string().optional().describe('ID đơn hàng liên quan'),
  amount: z.number().int().min(1).describe('Số điểm tích (giá trị dương)'),
  reason: z.string().optional().describe('Lý do tích điểm'),
});
export class EarnPointsDto extends createZodDto(EarnPointsSchema) {}

const RedeemPointsSchema = z.object({
  userId: z.string().min(1).describe('ID người dùng'),
  orderId: z.string().optional().describe('ID đơn hàng sử dụng điểm'),
  amount: z.number().int().min(1).describe('Số điểm tiêu (giá trị dương)'),
  reason: z.string().optional().describe('Lý do sử dụng điểm'),
  orderTotal: z.number().int().optional().describe('Tổng giá trị đơn hàng'),
});
export class RedeemPointsDto extends createZodDto(RedeemPointsSchema) {}

const RefundPointsSchema = z.object({
  userId: z.string().min(1).describe('ID người dùng'),
  orderId: z.string().optional().describe('ID đơn hàng hoàn tiền'),
  amount: z.number().int().min(1).describe('Số điểm hoàn lại'),
  reason: z.string().optional().describe('Lý do hoàn điểm'),
});
export class RefundPointsDto extends createZodDto(RefundPointsSchema) {}
