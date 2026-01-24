import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

/**
 * =====================================================================
 * GOOGLE STRATEGY - ĐĂNG NHẬP QUA GOOGLE (OAUTH2)
 * =====================================================================
 *
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
