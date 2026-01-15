import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

/**
 * =====================================================================
 * FACEBOOK STRATEGY - ĐĂNG NHẬP QUA FACEBOOK
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FACEBOOK OAUTH:
 * - Tương tự Google, ta dùng Passport-Facebook để tích hợp đăng nhập.
 * - Cần `FACEBOOK_APP_ID` và `APP_SECRET` lấy từ trang quản lý ứng dụng của Facebook Developer.
 *
 * 2. PROFILE FIELDS:
 * - Khác với Google, Facebook cần được chỉ định rõ các trường muốn lấy qua `profileFields` (VD: name, emails, photos) để tránh lỗi không lấy được dữ liệu.
 *
 * 3. VALIDATE:
 * - Trả về một object User chuẩn. Lưu ý: Một số User Facebook không công khai Email, nên ta cần xử lý logic `emails ? emails[0].value : null` để tránh crash app. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('FACEBOOK_APP_ID') || 'PLACEHOLDER_APP_ID',
      clientSecret:
        configService.get('FACEBOOK_APP_SECRET') || 'PLACEHOLDER_APP_SECRET',
      callbackURL:
        configService.get('FACEBOOK_CALLBACK_URL') ||
        'http://localhost:4000/auth/facebook/callback',
      scope: 'email',
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): any {
    const { name, emails, photos, id } = profile;
    const user = {
      email: emails ? emails[0].value : null,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos ? photos[0].value : null,
      accessToken,
      facebookId: id,
    };
    done(null, user);
  }
}
