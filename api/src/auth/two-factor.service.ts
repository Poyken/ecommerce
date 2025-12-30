import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

/**
 * =====================================================================
 * TWO FACTOR SERVICE - XÁC THỰC 2 LỚP (2FA)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TOTP (Time-based One-Time Password):
 * - Đây là cơ chế mã số dùng một lần thay đổi theo thời gian (thường là 30 giây).
 * - Hệ thống sử dụng thư viện `otplib` để tạo và xác thực mã này.
 *
 * 2. SECRET KEY:
 * - Mỗi user kích hoạt 2FA sẽ có một `twoFactorSecret` riêng.
 * - Secret này được dùng để tạo ra chuỗi số 6 chữ số mà bạn thấy trên Google Authenticator hoặc Authy.
 *
 * 3. QUY TRÌNH KÍCH HOẠT:
 * - Bước 1: Tạo Secret -> Tạo Link `otpauth` -> Chuyển thành QR Code.
 * - Bước 2: User quét mã bằng app điện thoại.
 * - Bước 3: User nhập mã từ app để xác nhận -> Server lưu Secret và bật `twoFactorEnabled`.
 * =====================================================================
 */
@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo secret key cho 2FA
   */
  generateSecret(userEmail: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      userEmail,
      'Luxe Ecommerce',
      secret,
    );

    return {
      secret,
      otpauthUrl,
    };
  }

  /**
   * Tạo QR code dưới dạng Data URL (base64)
   */
  async generateQrCodeDataURL(otpauthUrl: string) {
    return toDataURL(otpauthUrl);
  }

  /**
   * Kiểm tra mã TOTP code
   */
  verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({
      token,
      secret,
    });
  }

  /**
   * Kích hoạt 2FA cho user
   */
  async enableTwoFactor(userId: string, secret: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
      },
    });
  }

  /**
   * Vô hiệu hóa 2FA
   */
  async disableTwoFactor(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });
  }
}
