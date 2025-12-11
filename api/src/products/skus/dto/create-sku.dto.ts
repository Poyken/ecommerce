import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSkuDto {
  @ApiProperty({ example: 'IP15PM-BLUE-256' })
  @IsString()
  @IsNotEmpty()
  skuCode: string;

  @ApiProperty({ example: 29990000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'uuid-product-id' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  // Mảng các ID OptionValue (ví dụ: ID của "Blue" và ID của "256GB")
  // Các ID này đến từ phản hồi tạo Product hoặc các truy vấn OptionValue riêng biệt
  @ApiProperty({ example: ['uuid-opt-val-1', 'uuid-opt-val-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  optionValueIds: string[];
}
