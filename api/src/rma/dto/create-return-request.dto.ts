import {
  IsString,
  IsArray,
  IsInt,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
  @IsString()
  @IsNotEmpty()
  orderItemId: string; // ID của sản phẩm trong đơn hàng cần trả

  @IsInt()
  quantity: number; // Số lượng trả
}

export class CreateReturnRequestDto {
  @IsString()
  @IsNotEmpty()
  orderId: string; // ID đơn hàng

  @IsString()
  @IsNotEmpty()
  reason: string; // Lý do trả hàng (Lỗi NSX, Không ưng ý...)

  @IsOptional()
  @IsString()
  description?: string; // Mô tả chi tiết thêm

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[]; // Danh sách URL ảnh bằng chứng hoặc ID Media

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[]; // Danh sách các món cần trả
}
