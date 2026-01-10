/**
 * =====================================================================
 * AUTH CONTROLLER - Cổng xác thực & Tài khoản
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HTTP-ONLY COOKIE:
 * - Refresh Token được lưu trong `httpOnly` cookie để chống XSS (JavaScript không đọc được).
 * - Access Token trả về verify body để Client dùng gọi API.
 *
 * 2. SECURITY FEATURES:
 * - 2FA (Two-Factor Auth): Sinh QR Code, verify OTP.
 * - Social Login: Google/Facebook OAuth2 callback xử lý ở đây.
 * - Throttling: `@Throttle` giới hạn số lần thử login để chống Brute Force.
 * =====================================================================
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import {
  ApiCreateResponse,
  ApiGetOneResponse,
  ApiUpdateResponse,
} from '@/common/decorators/crud.decorators';
import { getFingerprint } from '@/common/utils/fingerprint';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TwoFactorService } from './two-factor.service';

/**
 * =====================================================================
 * AUTH CONTROLLER - CỔNG XÁC THỰC & QUẢN LÝ TÀI KHOẢN
 * =====================================================================
 */

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Post('register')
  @ApiCreateResponse('User', { summary: 'Đăng ký tài khoản mới' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: any,
    @Request() req: any,
  ) {
    const fp = getFingerprint(req);
    const data = await this.authService.register(dto, fp);

    (res as Response).cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);
    return { data };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiCreateResponse('Object', { summary: 'Đăng nhập (Return Token)' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: any,
    @Request() req: any,
  ) {
    const fp = getFingerprint(req);
    const ip =
      req.ip || (req.headers['x-forwarded-for'] as string) || '0.0.0.0';
    const data = await this.authService.login(dto, fp, ip);

    if ('refreshToken' in data) {
      (res as Response).cookie(
        'refreshToken',
        data.refreshToken,
        COOKIE_OPTIONS,
      );
    }

    return { data };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiGetOneResponse('Boolean', { summary: 'Đăng xuất' })
  async logout(@Request() req: any, @Res({ passthrough: true }) res: any) {
    (res as Response).clearCookie('refreshToken', {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });
    const data = await this.authService.logout(req.user.userId, req.user.jti);
    return { data };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiGetOneResponse('User', { summary: 'Lấy thông tin profile' })
  async getProfile(@Request() req: any) {
    const data = await this.authService.getMe(req.user.userId);
    return { data };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUpdateResponse('User', { summary: 'Cập nhật thông tin cá nhân' })
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    const data = await this.authService.updateProfile(req.user.userId, body);
    return { data };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCreateResponse('Object', { summary: 'Refresh Token' })
  async refresh(@Request() req: any, @Res({ passthrough: true }) res: any) {
    const tokenFromCookie = req.cookies['refreshToken'];
    const fp = getFingerprint(req);

    if (!tokenFromCookie) {
      throw new UnauthorizedException('No refresh token in cookies');
    }

    const data = await this.authService.refreshTokens(tokenFromCookie, fp);
    (res as Response).cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);
    return { data: { accessToken: data.accessToken } };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiCreateResponse('Boolean', { summary: 'Yêu cầu reset mật khẩu' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto.email);
    return { data };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiUpdateResponse('Boolean', { summary: 'Reset mật khẩu' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(
      dto.token,
      dto.newPassword,
    );
    return { data };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google' })
  googleLogin() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google Callback' })
  async googleCallback(@Request() req: any, @Res() res: any) {
    const fp = getFingerprint(req);
    const user = req.user as unknown as {
      email: string;
      firstName: string;
      lastName: string;
      picture?: string;
      googleId: string;
    };

    const data = await this.authService.validateSocialLogin(
      {
        ...user,
        provider: 'google',
        socialId: user.googleId,
      },
      fp,
    );
    (res as Response).cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);
    (res as Response).redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/social-callback?accessToken=${data.accessToken}`,
    );
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Login with Facebook' })
  facebookLogin() {
    // Redirects to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook Callback' })
  async facebookCallback(@Request() req: any, @Res() res: any) {
    const fp = getFingerprint(req);
    const user = req.user as unknown as {
      email: string;
      firstName: string;
      lastName: string;
      picture?: string;
      facebookId: string;
    };

    const data = await this.authService.validateSocialLogin(
      {
        ...user,
        provider: 'facebook',
        socialId: user.facebookId,
      },
      fp,
    );

    (res as Response).cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);

    (res as Response).redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/social-callback?accessToken=${data.accessToken}`,
    );
  }

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION ENDPOINTS
  // ============================================================================

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreateResponse('Object', { summary: 'Tạo mã 2FA secret & QR Code' })
  async generate2FA(@Request() req: any) {
    const user = await this.authService.getMe(req.user.userId);
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(
      user.email,
    );
    const qrCode =
      await this.twoFactorService.generateQrCodeDataURL(otpauthUrl);
    return { data: { secret, qrCode } };
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreateResponse('Boolean', { summary: 'Kích hoạt 2FA' })
  async enable2FA(
    @Request() req: any,
    @Body() body: { token: string; secret: string },
  ) {
    if (!body.token || !body.secret) {
      throw new BadRequestException('Mã xác thực và mã bí mật là bắt buộc');
    }
    const isValid = this.twoFactorService.verifyToken(body.token, body.secret);
    if (!isValid) {
      throw new UnauthorizedException('Mã xác thực không hợp lệ');
    }
    await this.twoFactorService.enableTwoFactor(req.user.userId, body.secret);
    return { message: 'Kích hoạt 2FA thành công' };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreateResponse('Boolean', { summary: 'Vô hiệu hóa 2FA' })
  async disable2FA(@Request() req: any, @Body() body: { token: string }) {
    const user = await this.authService.getMe(req.user.userId);
    if (!user.twoFactorSecret) {
      throw new UnauthorizedException('2FA chưa được kích hoạt');
    }
    const isValid = this.twoFactorService.verifyToken(
      body.token,
      user.twoFactorSecret,
    );
    if (!isValid) {
      throw new UnauthorizedException('Mã xác thực không hợp lệ');
    }
    await this.twoFactorService.disableTwoFactor(req.user.userId);
    return { message: 'Vô hiệu hóa 2FA thành công' };
  }

  @Post('2fa/login')
  @HttpCode(HttpStatus.OK)
  @ApiCreateResponse('Object', { summary: 'Xác thực 2FA khi đăng nhập' })
  async login2FA(
    @Body() body: { userId: string; token: string },
    @Res({ passthrough: true }) res: any,
    @Request() req: any,
  ) {
    const fp = getFingerprint(req);
    const data = await this.authService.verify2FALogin(
      body.userId,
      body.token,
      fp,
    );

    (res as Response).cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);
    return { data };
  }
}
