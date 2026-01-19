import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * UPDATE PROFILE DTO - Cập nhật thông tin cá nhân
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TẠI SAO CÁC TRƯỜNG ĐỀU LÀ OPTIONAL?
 * - User có thể chỉ muốn đổi `avatarUrl` mà giữ nguyên `firstName`.
 * - Nếu bắt buộc gửi tất cả (`IsNotEmpty`), Frontend sẽ phải query dữ liệu cũ rồi gửi lại -> Thừa thãi.
 *
 * 2. VALIDATION:
 * - `MinLength(2)`: Tên người ít nhất phải 2 ký tự (vd: "An").
 * - `IsUrl()`: Đảm bảo avatar phải là link ảnh hợp lệ (thường từ Cloudinary/S3). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
const UpdateProfileSchema = z.object({
  firstName: z.string().optional().describe('John'),
  lastName: z.string().optional().describe('Doe'),
  avatarUrl: z.string().optional().describe('new_avatar_url'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải ít nhất 6 ký tự')
    .optional()
    .describe('newpassword123'),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
