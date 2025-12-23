import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ImportRowDto {
  @ApiProperty()
  @IsString()
  skuCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ImportSkusDto {
  @ApiProperty({ type: [ImportRowDto] })
  @IsArray()
  rows: ImportRowDto[];
}

export class PriceChangeDto {
  @ApiProperty({ enum: ['fixed', 'percentage'] })
  @IsEnum(['fixed', 'percentage'])
  type: 'fixed' | 'percentage';

  @ApiProperty()
  @IsNumber()
  value: number;
}

export class StockChangeDto {
  @ApiProperty({ enum: ['set', 'add', 'subtract'] })
  @IsEnum(['set', 'add', 'subtract'])
  type: 'set' | 'add' | 'subtract';

  @ApiProperty()
  @IsNumber()
  value: number;
}

export class BulkUpdateDto {
  @ApiProperty()
  @IsArray()
  skuIds: string[];

  @ApiProperty({ required: false, type: PriceChangeDto })
  @IsOptional()
  priceChange?: PriceChangeDto;

  @ApiProperty({ required: false, type: StockChangeDto })
  @IsOptional()
  stockChange?: StockChangeDto;
}
