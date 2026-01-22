import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

/**
 * =====================================================================
 * TWO FACTOR SERVICE - XÁC THỰC 2 LỚP (2FA)
 * =====================================================================
 *
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
