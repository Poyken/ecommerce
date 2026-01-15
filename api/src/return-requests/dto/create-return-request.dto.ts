import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Loại yêu cầu đổi trả
 */
export enum ReturnType {
  REFUND_ONLY = 'REFUND_ONLY',
  RETURN_AND_REFUND = 'RETURN_AND_REFUND',
  EXCHANGE = 'EXCHANGE',
}

/**
 * Phương thức gửi trả hàng
 */
export enum ReturnMethod {
  AT_COUNTER = 'AT_COUNTER',
  PICKUP = 'PICKUP',
  SELF_SHIP = 'SELF_SHIP',
}

/**
 * Phương thức hoàn tiền
 */
export enum RefundMethod {
  ORIGINAL_PAYMENT = 'ORIGINAL_PAYMENT',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

class ReturnItemDto {
  @ApiProperty({
    description: 'ID của OrderItem cần trả',
    example: 'uuid-of-order-item',
  })
  @IsUUID()
  orderItemId: string;

  @ApiProperty({ description: 'Số lượng trả', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

class BankAccountDto {
  @ApiProperty({ description: 'Tên ngân hàng', example: 'Vietcombank' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: 'Số tài khoản', example: '1234567890' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Chủ tài khoản', example: 'NGUYEN VAN A' })
  @IsString()
  owner: string;
}

export class CreateReturnRequestDto {
  @ApiProperty({
    description: 'ID đơn hàng cần đổi trả',
    example: 'uuid-of-order',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Lý do đổi trả', example: 'Sản phẩm bị lỗi' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết',
    example: 'Màn hình bị vỡ góc phải',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ReturnType,
    description: 'Loại yêu cầu',
    example: ReturnType.RETURN_AND_REFUND,
  })
  @IsEnum(ReturnType)
  type: ReturnType;

  // LOGISTICS
  @ApiProperty({
    enum: ReturnMethod,
    description: 'Phương thức gửi trả',
    example: ReturnMethod.SELF_SHIP,
  })
  @IsEnum(ReturnMethod)
  returnMethod: ReturnMethod;

  @ApiPropertyOptional({
    description: 'Địa chỉ lấy hàng (nếu chọn PICKUP)',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  pickupAddress?: Record<string, any>;

  // FINANCE
  @ApiProperty({
    enum: RefundMethod,
    description: 'Phương thức hoàn tiền',
    example: RefundMethod.BANK_TRANSFER,
  })
  @IsEnum(RefundMethod)
  refundMethod: RefundMethod;

  @ApiPropertyOptional({
    description: 'Thông tin tài khoản ngân hàng (nếu chọn BANK_TRANSFER)',
    type: BankAccountDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountDto)
  bankAccount?: BankAccountDto;

  @ApiPropertyOptional({
    description: 'Số tiền hoàn lại dự kiến',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @ApiProperty({
    description: 'Danh sách ảnh bằng chứng (URLs)',
    example: ['https://example.com/image1.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'Danh sách sản phẩm cần trả',
    type: [ReturnItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
