import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * =====================================================================
 * CLOUDINARY PROVIDER - Cấu hình nhà cung cấp dịch vụ Cloudinary
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CUSTOM PROVIDER:
 * - Đây là một Custom Provider sử dụng `useFactory`.
 * - Nó cho phép ta thực hiện logic cấu hình (như gọi `cloudinary.config`) trước khi cung cấp instance cho ứng dụng.
 *
 * 2. CONFIGURATION MANAGEMENT:
 * - Ta sử dụng `ConfigService` để lấy các thông tin nhạy cảm (API Key, Secret) từ biến môi trường (`.env`).
 * - Giúp bảo mật thông tin và dễ dàng thay đổi cấu hình giữa các môi trường (Dev, Staging, Prod).
 *
 * 3. DEPENDENCY INJECTION:
 * - `inject: [ConfigService]` báo cho NestJS biết rằng factory này cần `ConfigService` để hoạt động. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Quản lý state toàn cục (Global State) hoặc cung cấp dependency injection cho cây component.

 * =====================================================================
 */

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('CLOUDINARY_API_KEY'),
      api_secret: configService.get('CLOUDINARY_API_SECRET'),
    });
  },
  inject: [ConfigService],
};
