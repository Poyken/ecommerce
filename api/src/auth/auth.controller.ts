import { getFingerprint } from '@/common/utils/fingerprint';
import {
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

/**
 * =====================================================================
 * AUTH CONTROLLER - Cổng xác thực và quản lý tài khoản
 * =====================================================================
 */
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TwoFactorService } from './two-factor.service';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Changed from 'strict' - allows cookies on redirects
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Redundant local getFingerprint removed, using shared utility from @/common/utils/fingerprint

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công.' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại.' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ) {
    const fp = getFingerprint(req);
    const data = await this.authService.register(dto, fp);

    // Set refreshToken in HttpOnly cookie for security
    res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);

    // CHANGED: Also return refreshToken in body for frontend session management
    // This is consistent with social login flow
    return { data };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về Access Token và User Info.',
  })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu.' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ) {
    const fp = getFingerprint(req);
    const data = await this.authService.login(dto, fp);

    // Set refreshToken in HttpOnly cookie for security
    res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);

    // CHANGED: Also return refreshToken in body for frontend session management
    // This is consistent with register and social login flows
    return { data };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất (Revoke Refresh Token)' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công.' })
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });

    const data = await this.authService.logout(req.user.userId, req.user.jti);
    return { data };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin profile & quyền hạn của tôi' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin user chi tiết.' })
  async getProfile(@Request() req: any) {
    const data = await this.authService.getMe(req.user.userId);
    return { data };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công.' })
  async updateProfile(@Request() req: any, @Body() body: any) {
    const data = await this.authService.updateProfile(req.user.userId, body);
    return { data };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy Access Token mới bằng Refresh Token từ Cookie',
  })
  @ApiResponse({ status: 200, description: 'Cấp lại token thành công.' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn.',
  })
  async refresh(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokenFromCookie = req.cookies['refreshToken'];
    const fp = getFingerprint(req);

    if (!tokenFromCookie) {
      throw new UnauthorizedException('No refresh token in cookies');
    }

    const data = await this.authService.refreshTokens(tokenFromCookie, fp);

    res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);

    return { data: { accessToken: data.accessToken } };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto.email);
    return { data };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
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
  async googleCallback(@Request() req, @Res() res: Response) {
    const fp = getFingerprint(req);
    const data = await this.authService.validateSocialLogin(
      {
        ...req.user,
        provider: 'google',
        socialId: req.user.googleId,
      },
      fp,
    );

    res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);

    res.redirect(
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
  async facebookCallback(@Request() req, @Res() res: Response) {
    const fp = getFingerprint(req);
    const data = await this.authService.validateSocialLogin(
      {
        ...req.user,
        provider: 'facebook',
        socialId: req.user.facebookId,
      },
      fp,
    );

    res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);

    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/social-callback?accessToken=${data.accessToken}`,
    );
  }

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION ENDPOINTS
  // ============================================================================

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mã 2FA secret & QR Code' })
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
  @ApiOperation({ summary: 'Kích hoạt 2FA' })
  async enable2FA(
    @Request() req: any,
    @Body() body: { token: string; secret: string },
  ) {
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
  @ApiOperation({ summary: 'Vô hiệu hóa 2FA' })
  async disable2FA(@Request() req: any, @Body() body: { token: string }) {
    const user = await this.authService.getMe(req.user.userId);
    const isValid = this.twoFactorService.verifyToken(
      body.token,
      user.twoFactorSecret as string,
    );
    if (!isValid) {
      throw new UnauthorizedException('Mã xác thực không hợp lệ');
    }
    await this.twoFactorService.disableTwoFactor(req.user.userId);
    return { message: 'Vô hiệu hóa 2FA thành công' };
  }

  @Post('2fa/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực 2FA khi đăng nhập' })
  async login2FA(
    @Body() body: { userId: string; token: string },
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ) {
    const fp = getFingerprint(req);
    const data = await this.authService.verify2FALogin(
      body.userId,
      body.token,
      fp,
    );

    res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);
    return { data };
  }
}
