import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

/**
 * =====================================================================
 * GOOGLE STRATEGY - ĐĂNG NHẬP QUA GOOGLE (OAUTH2)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. OAUTH 2.0 FLOW:
 * - Thay vì bắt user nhập mật khẩu (nguy hiểm), ta chuyển hướng họ sang Google.
 * - Sau khi user đồng ý, Google gửi về một `profile` chứa: Email, Tên, Ảnh đại diện.
 *
 * 2. SCOPE:
 * - Ta chỉ xin quyền lấy `email` và `profile`. Đây là những thông tin tối thiểu cần thiết để tạo tài khoản.
 *
 * 3. VALIDATE:
 * - Sau khi lấy được dữ liệu từ Google, ta "đóng gói" lại thành một Object User chuẩn của hệ thống để chuyển giao cho AuthService xử lý tiếp (Tạo mới hoặc đăng nhập). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID:
        configService.get('GOOGLE_CLIENT_ID') || 'PLACEHOLDER_CLIENT_ID',
      clientSecret:
        configService.get('GOOGLE_CLIENT_SECRET') ||
        'PLACEHOLDER_CLIENT_SECRET',
      callbackURL:
        configService.get('GOOGLE_CALLBACK_URL') ||
        'http://localhost:8080/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): any {
    const { name, emails, photos, id } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      googleId: id,
    };
    done(null, user);
  }
}
