import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Max, Min } from 'class-validator';

/**
 * =====================================================================
 * ADD TO CART DTO - Dữ liệu thêm vào giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TẠI SAO DÙNG DTO?
 * - Data Transfer Object giúp kiểm soát dữ liệu đầu vào chặt chẽ.
 * - Nếu Hacker gửi `quantity: -100` hoặc `quantity: 1000000`, hệ thống sẽ chặn ngay
 *   tại lớp Validation Pipe trước khi code xử lý chạy -> Bảo mật & An toàn.
 *
 * 2. CÁC LUẬT (RULES):
 * - `IsUUID('4')`: Đảm bảo `skuId` phải là mã định danh hợp lệ (UUID v4).
 * - `Min(1)`: Không ai mua 0 hoặc âm sản phẩm cả.
 * - `Max(999)`: Giới hạn số lượng một lần mua để tránh lỗi hiển thị UI hoặc Spam đơn hàng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class AddToCartDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Mã định danh của SKU sản phẩm',
  })
  @IsUUID('4', { message: 'SKU ID không hợp lệ' })
  skuId: string;

  @ApiProperty({ example: 1, description: 'Số lượng sản phẩm muốn thêm' })
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(999, { message: 'Số lượng tối đa là 999 sản phẩm' })
  quantity: number;
}
