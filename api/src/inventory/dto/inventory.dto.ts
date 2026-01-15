import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({
    description: 'Tên kho (VD: Kho Hà Nội)',
    example: 'Kho Hà Nội Main',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ kho',
    example: '123 Đường ABC, Hà Nội',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Có phải kho mặc định không',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateStockDto {
  @ApiProperty({ description: 'ID kho' })
  @IsString()
  warehouseId: string;

  @ApiProperty({ description: 'ID SKU' })
  @IsString()
  skuId: string;

  @ApiProperty({
    description: 'Số lượng thay đổi (+ nhập, - xuất)',
    example: 10,
  })
  @IsInt()
  quantity: number;

  @ApiProperty({
    description: 'Lý do thay đổi stock',
    example: 'Nhập hàng từ NCC',
  })
  @IsString()
  reason: string;
}

export class TransferStockDto {
  @ApiProperty({ description: 'ID kho nguồn' })
  @IsString()
  fromWarehouseId: string;

  @ApiProperty({ description: 'ID kho đích' })
  @IsString()
  toWarehouseId: string;

  @ApiProperty({ description: 'ID SKU' })
  @IsString()
  skuId: string;

  @ApiProperty({ description: 'Số lượng chuyển', example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Ghi chú chuyển kho',
    example: 'Điều chuyển kho định kỳ',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
