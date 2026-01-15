import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  name: string; // Tên kho (VD: Kho Hà Nội)

  @IsOptional()
  @IsString()
  address?: string; // Địa chỉ kho

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean; // Có phải kho mặc định không
}

export class UpdateStockDto {
  @IsString()
  warehouseId: string; // ID kho

  @IsString()
  skuId: string; // ID SKU

  @IsInt()
  quantity: number; // Số lượng thay đổi (+ nhập, - xuất)

  @IsString()
  reason: string; // Lý do thay đổi stock
}
