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

class ReturnItemDto {
  @IsUUID()
  orderItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class BankAccountDto {
  @IsString()
  bankName: string;

  @IsString()
  number: string;

  @IsString()
  owner: string;
}

export class CreateReturnRequestDto {
  @IsUUID()
  orderId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ReturnType)
  type: ReturnType;

  // LOGISTICS
  @IsEnum(ReturnMethod)
  returnMethod: ReturnMethod;

  @IsOptional()
  @IsObject()
  pickupAddress?: Record<string, any>;

  // FINANCE
  @IsEnum(RefundMethod)
  refundMethod: RefundMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountDto)
  bankAccount?: BankAccountDto;

  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
