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
 * - Throttling: `@Throttle` giới hạn số lần thử login để chống Brute Force. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Cổng giao tiếp cho các hành động đăng nhập, đăng ký và xác thực hai lớp (2FA).

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
import {
  LoginUseCase,
  RegisterUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
} from '../application/use-cases/auth';
import { getTenant } from '@core/tenant/tenant.context';

/**
 * =====================================================================
 * AUTH CONTROLLER - CỔNG XÁC THỰC & QUẢN LÝ TÀI KHOẢN
 * =====================================================================
 */

/**
 * 🌐 CẤU HÌNH COOKIE CHO PRODUCTION (VERCEL + RENDER)
 * 📚 TẠI SAO CẦN SameSite: 'none' VÀ Secure: true?
 * 1. Vì Web (Vercel) và API (Render) nằm trên 2 domain khác nhau hoàn toàn.
 * 2. Trình duyệt mặc định sẽ CHẶN cookie của API gửi về Web (Cross-site).
 * 3. 'none' cho phép gửi xuyên domain, và 'none' BẮT BUỘC phải đi kèm 'secure: true'.
 *
 * ⚠️ LƯU Ý: Không được đổi về 'lax' hay 'strict' khi deploy thực tế,
 * nếu không User sẽ không thể đăng nhập hoặc duy trì phiên làm việc.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // Bắt buộc phải có để SameSite 'none' hoạt động
  sameSite: 'none' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('register')
  @ApiCreateResponse('User', { summary: 'Đăng ký tài khoản mới' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: any,
    @Request() req: any,
  ) {
    const fp = getFingerprint(req);
    // Use Case implementation
    const tenant = (req as any).tenant; // Extracted by middleware usually, but RegisterDto might not have it if public.
    // Usually register is for Customer in a specific Tenant Context if subdomain is there.
    // If Global Register (like signup for new tenant), that's handled by TenantRegistrationController.
    // This endpoint is for Customer Registration in a Store.

    // We need to resolve tenantId. If standard AuthGuard is not used, we might rely on Headers or Host.
    // Assuming Middleware resolves Tenant and puts it in Context or Request.
    // But @Request req might not have tenant if not Authenticated?
    // In multi-tenancy, usually tenant is resolved by domain even for public routes.

    // For now, let's assume getTenant() from context works or passed in DTO?
    // Legacy Code used: const tenant = getTenant();
    const tenantContext = getTenant();
    if (!tenantContext)
      throw new BadRequestException('Tenant context required');

    const result = await this.registerUseCase.execute({
      email: dto.email,
      password: dto.password, // UseCase will hash it
      firstName: dto.firstName,
      lastName: dto.lastName,
      tenantId: tenantContext.id,
      fingerprint: fp,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    (res as Response).cookie(
      'refreshToken',
      result.value.refreshToken,
      COOKIE_OPTIONS,
    );
    return { data: result.value };
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
    const tenantContext = getTenant();

    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
      tenantId: tenantContext?.id,
      fingerprint: fp,
      ip,
    });

    if (result.isFailure) {
      throw new UnauthorizedException(result.error.message);
    }

    const data = result.value;

    if (data.refreshToken) {
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

    await this.logoutUseCase.execute({
      userId: req.user.userId,
      jti: req.user.jti,
    });

    return { data: { message: 'Logged out successfully' } };
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

    const result = await this.refreshTokenUseCase.execute({
      refreshToken: tokenFromCookie,
      fingerprint: fp,
    });

    if (result.isFailure) {
      throw new UnauthorizedException(result.error.message);
    }

    (res as Response).cookie(
      'refreshToken',
      result.value.refreshToken,
      COOKIE_OPTIONS,
    );
    return { data: { accessToken: result.value.accessToken } };
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
    const user = await this.authService.getUserWithSecrets(req.user.userId);
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
    const user = await this.authService.getUserWithSecrets(req.user.userId);
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
