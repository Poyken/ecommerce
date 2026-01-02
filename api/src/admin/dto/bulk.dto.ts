import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * =====================================================================
 * BULK IMPORT/UPDATE DTO - Xử lý dữ liệu hàng loạt
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BULK UPDATE LÀ GÌ?
 * - Thay vì gọi API update cho từng sản phẩm (1000 requests = chết server),
 *   ta gửi một mảng (Array) gồm 1000 items trong 1 request duy nhất.
 *
 * 2. NESTED VALIDATION:
 * - `ImportSkusDto` chứa một mảng `rows`. Mỗi item trong mảng đó phải tuân thủ `ImportRowDto`.
 * - Decorator `@Type(() => ImportRowDto)` (của class-transformer - cần thêm nếu chưa có)
 *   thường được dùng để validate nested object. Ở đây ta đang trust array.
 *
 * 3. DRY RUN:
 * - Chế độ "Chạy thử". Server sẽ validate dữ liệu, kiểm tra lỗi logic nhưng KHÔNG lưu vào DB.
 * - Giúp User biết file Excel của họ có lỗi gì không trước khi import thật.
 * =====================================================================
 */
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

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  dryRun?: boolean;
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
