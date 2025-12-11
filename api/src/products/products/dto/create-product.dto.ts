import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateOptionDto {
  @ApiProperty({ example: 'Color' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ['Red', 'Blue'] })
  @IsArray()
  @IsString({ each: true })
  values: string[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'iphone-15-pro-max', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'Flagship phone from Apple...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-category-id' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'uuid-brand-id' })
  @IsUUID()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({ type: [CreateOptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
