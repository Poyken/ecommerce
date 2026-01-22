import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

/**
 * =====================================================================
 * FACEBOOK STRATEGY - ĐĂNG NHẬP QUA FACEBOOK
 * =====================================================================
 *
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
