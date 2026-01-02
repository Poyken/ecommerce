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
 * - `Max(999)`: Giới hạn số lượng một lần mua để tránh lỗi hiển thị UI hoặc Spam đơn hàng.
 * =====================================================================
 */
export class AddToCartDto {
  @IsUUID('4', { message: 'SKU ID không hợp lệ' })
  skuId: string;

  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(999, { message: 'Số lượng tối đa là 999 sản phẩm' })
  quantity: number;
}
