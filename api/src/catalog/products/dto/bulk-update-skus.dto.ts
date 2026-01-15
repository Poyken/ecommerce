import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

export class UpdateSkuDto {
  @ApiProperty({ example: 'uuid-sku-id' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 90000 })
  @IsNumber()
  @IsOptional()
  salePrice?: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsOptional()
  stock?: number;
}

export class BulkUpdateSkusDto {
  @ApiProperty({ type: [UpdateSkuDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkuDto)
  skus: UpdateSkuDto[];
}
