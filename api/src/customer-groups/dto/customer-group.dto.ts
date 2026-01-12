import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Tên nhóm (Vip, Bán buôn)

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priceListId?: string; // ID bảng giá áp dụng
}

export class PriceListItemDto {
  @IsString()
  skuId: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;
}

export class CreatePriceListDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Tên bảng giá

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemDto)
  items: PriceListItemDto[];
}
