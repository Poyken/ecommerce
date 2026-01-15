import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// =====================================================================
// CUSTOMER GROUP DTOs
// =====================================================================

export class CreateCustomerGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Tên nhóm (VIP, Bán buôn, Đại lý C1)

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priceListId?: string; // ID bảng giá áp dụng
}

export class UpdateCustomerGroupDto extends PartialType(
  CreateCustomerGroupDto,
) {}

// =====================================================================
// PRICE LIST DTOs
// =====================================================================

export class PriceListItemDto {
  @IsString()
  skuId: string;

  @IsNumber()
  price: number; // Giá áp dụng

  @IsOptional()
  @IsNumber()
  compareAtPrice?: number; // Giá gốc (gạch ngang)
}

export class CreatePriceListDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Tên bảng giá (VD: Bảng giá đại lý)

  @IsOptional()
  @IsString()
  currency?: string; // Đơn vị tiền tệ (VND)

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean; // Là bảng giá mặc định?

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Đang kích hoạt?

  @IsOptional()
  @IsDateString()
  startDate?: string; // Ngày bắt đầu áp dụng

  @IsOptional()
  @IsDateString()
  endDate?: string; // Ngày kết thúc

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemDto)
  items?: PriceListItemDto[]; // Danh sách giá SKU
}

export class UpdatePriceListDto extends PartialType(CreatePriceListDto) {}

export class AddPriceListItemDto {
  @IsString()
  skuId: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;
}

// =====================================================================
// PRICING QUERY DTOs
// =====================================================================

export class GetPricesDto {
  @IsArray()
  @IsString({ each: true })
  skuIds: string[];
}
