import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * =====================================================================
 * CREATE SKU DTO - Đối tượng tạo biến thể sản phẩm mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SKU IDENTIFICATION:
 * - `skuCode`: Mã định danh duy nhất cho từng biến thể. Rất quan trọng cho việc quét mã vạch và quản lý kho sau này.
 *
 * 2. FINANCIAL & INVENTORY VALIDATION:
 * - `@Min(0)` cho `price` và `stock`: Đảm bảo giá bán và số lượng tồn kho không bao giờ là số âm.
 *
 * 3. OPTION MAPPING:
 * - `optionValueIds`: Danh sách các ID thuộc tính (Màu sắc, Kích thước) định nghĩa nên SKU này.
 * - `@IsUUID('4', { each: true })`: Kiểm tra từng phần tử trong mảng phải là một UUID hợp lệ.
 *
 * 4. IMAGE HANDLING:
 * - `imageUrl`: Mặc dù trong Swagger ta khai báo là `binary` (để hiện nút upload file), nhưng trong DTO nó sẽ được gán URL sau khi upload thành công lên Cloudinary.
 * =====================================================================
 */

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

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
