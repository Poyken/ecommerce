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
 * AUTH CONTROLLER - CỔNG XÁC THỰC & QUẢN LÝ TÀI KHOẢN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HTTP-ONLY COOKIES:
 * - Để bảo mật, `refreshToken` không được trả về trong JSON body mà được set vào HttpOnly Cookie.
 * - Điều này ngăn chặn việc JavaScript (XSS) có thể đọc được token, giúp hệ thống an toàn hơn.
 *
 * 2. DOUBLE SUBMIT COOKIE (CSRF):
 * - Hệ thống sử dụng CSRF protection. Khi đăng nhập/đổi session, ta reset và set lại CSRF cookie.
 *
 * 3. SOCIAL LOGIN FLOW:
 * - Với Google/Facebook, Backend nhận callback -> Tạo User -> Redirect kèm `accessToken` về frontend.
 * - Sau khi redirect, frontend sẽ dùng token này để thiết lập session.
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TwoFactorService } from './two-factor.service';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { RequestWithUser } from './interfaces/request-with-user.interface';

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
    @Request() req: RequestWithUser,
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
    @Request() req: RequestWithUser,
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
  async logout(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });

    const data = await this.authService.logout(req.user.userId, req.user.jti);
    return { data };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin profile & quyền hạn của tôi' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin user chi tiết.' })
  async getProfile(@Request() req: RequestWithUser) {
    const data = await this.authService.getMe(req.user.userId);
    return { data };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công.' })
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() body: UpdateProfileDto,
  ) {
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
    @Request() req: RequestWithUser,
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
  async googleCallback(@Request() req: RequestWithUser, @Res() res: Response) {
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
  async facebookCallback(
    @Request() req: RequestWithUser,
    @Res() res: Response,
  ) {
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
  async generate2FA(@Request() req: RequestWithUser) {
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
    @Request() req: RequestWithUser,
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
  async disable2FA(
    @Request() req: RequestWithUser,
    @Body() body: { token: string },
  ) {
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
    @Request() req: RequestWithUser,
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
