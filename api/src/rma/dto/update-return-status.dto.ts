import { IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';
import { ReturnStatus } from '@prisma/client';

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatus)
  status: ReturnStatus; // Trạng thái mới: APPROVED, REJECTED, REFUNDED...

  @IsOptional()
  @IsString()
  adminNote?: string; // Ghi chú của admin (lý do từ chối hoặc hướng dẫn)

  @IsOptional()
  @IsNumber()
  refundAmount?: number; // Số tiền hoàn lại (nếu khác với tính toán tự động)
}
