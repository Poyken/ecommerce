import { IsNumber, IsUUID, Max, Min } from 'class-validator';

/**
 * DTO for adding items to cart
 * ✅ Business rules applied:
 * - Min: 1 (at least one item)
 * - Max: 999 (prevent abuse/UI issues)
 */
export class AddToCartDto {
  @IsUUID('4', { message: 'SKU ID không hợp lệ' })
  skuId: string;

  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(999, { message: 'Số lượng tối đa là 999 sản phẩm' })
  quantity: number;
}
