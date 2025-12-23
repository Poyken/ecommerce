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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * =====================================================================
 * AUTH CONTROLLER - Cổng xác thực và quản lý tài khoản
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AUTHENTICATION FLOWS:
 * - `register/login`: Các API cơ bản để bắt đầu phiên làm việc.
 * - `refresh`: Cơ chế lấy token mới mà không bắt người dùng đăng nhập lại (Silent Refresh).
 * - `forgot/reset password`: Quy trình khôi phục mật khẩu an toàn qua Token.
 *
 * 2. SECURITY WITH GUARDS:
 * - `@UseGuards(JwtAuthGuard)`: Được áp dụng cho các API nhạy cảm như `logout`, `me` (lấy profile).
 * - Đảm bảo chỉ những người đã đăng nhập mới có thể truy cập hoặc thay đổi thông tin cá nhân.
 *
 * 3. HTTP STATUS CODES:
 * - `@HttpCode(HttpStatus.OK)`: Mặc định POST trả về 201 (Created). Ta dùng 200 (OK) cho các hành động như Login/Refresh để đúng ngữ nghĩa hơn.
 *
 * 4. SWAGGER DOCUMENTATION:
 * - `@ApiResponse`: Mô tả chi tiết các trường hợp thành công và thất bại, giúp Frontend biết chính xác lỗi gì có thể xảy ra.
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

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công.' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại.' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { data };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công, trả về Tokens và User Info.',
  })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu.' })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { data };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard) // Bắt buộc phải có Token hợp lệ mới được Logout
  @ApiBearerAuth() // Hiển thị nút nhập Token trên Swagger
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất (Revoke Refresh Token)' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công.' })
  async logout(@Request() req: any) {
    const data = await this.authService.logout(req.user.userId);
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
  @ApiOperation({ summary: 'Lấy Access Token mới bằng Refresh Token' })
  @ApiResponse({ status: 200, description: 'Cấp lại token thành công.' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn.',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refreshTokens(dto.refreshToken);
    return { data };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu' })
  @ApiResponse({
    status: 200,
    description: 'Email đặt lại mật khẩu đã được gửi.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto.email);
    return { data };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới' })
  @ApiResponse({ status: 200, description: 'Mật khẩu đã được cập nhật.' })
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
  async googleCallback(@Request() req, @Res() res) {
    const data = await this.authService.validateSocialLogin({
      ...req.user,
      provider: 'google',
      socialId: req.user.googleId,
    });

    // Redirect to frontend with tokens
    // Security Note: In production, consider using cookies or a temporary code exchange
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/social-callback?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`,
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
  async facebookCallback(@Request() req, @Res() res) {
    const data = await this.authService.validateSocialLogin({
      ...req.user,
      provider: 'facebook',
      socialId: req.user.facebookId,
    });

    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/social-callback?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`,
    );
  }
}
