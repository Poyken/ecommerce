import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { getTenant, tenantStorage } from '@core/tenant/tenant.context'; // Import getTenant, tenantStorage
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { resolveMx } from 'dns/promises';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserEntity } from './entities/user.entity';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { UserWithPermissions } from './permission.service';
import { Prisma } from '@prisma/client';

/**
 * =====================================================================
 * AUTH SERVICE
 * =====================================================================
 */

import { PromotionsService } from '@/marketing/promotions/promotions.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AUTH_CONFIG } from '@core/config/constants';
import { PermissionService } from './permission.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly twoFactorService: TwoFactorService,
    private readonly permissionService: PermissionService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly emailService: EmailService,
    private readonly promotionsService: PromotionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // [SECURITY FIX C2] Split into safe and internal selectors to prevent credential leakage
  // This constant is for PUBLIC API responses - NEVER includes password or secrets
  private readonly USER_SELECT_SAFE = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    socialId: true,
    // ❌ NO password: true - NEVER expose this
    // ❌ NO twoFactorSecret: true - NEVER expose this
    tenantId: true,
    twoFactorEnabled: true,
    permissions: {
      select: {
        permission: {
          select: { name: true },
        },
      },
    },
    roles: {
      select: {
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                permission: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    },
  };

  // INTERNAL USE ONLY - For authentication operations that need password validation
  private readonly USER_SELECT_WITH_SECRETS = {
    ...this.USER_SELECT_SAFE,
    password: true,
    twoFactorSecret: true,
  };

  async register(dto: RegisterDto, fingerprint?: string) {
    const { email, password, firstName, lastName } = dto;

    // 1. Kiểm tra Email Domain thực tế (MX Check) để tránh email ảo
    await this.verifyEmailDomain(email);

    const tenant = getTenant();
    const existsUser = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant?.id,
      },
    });
    if (existsUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(
      password,
      AUTH_CONFIG.BCRYPT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        tenantId: tenant!.id, // Tenant được đảm bảo bởi Middleware
      },
    });

    await this.ensureGuestRoleAndAssign(user.id);

    // Tạo Token ngay sau khi đăng ký để auto-login
    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      [],
      ['GUEST'], // User mới mặc định quyền GUEST
      fingerprint,
    );

    // Lưu Refresh Token vào Redis
    await this.redisService.set(
      `refreshToken:${user.id}`,
      refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    try {
      // Tặng quà chào mừng (Async)
      await this.grantWelcomeVoucher(user.id);
    } catch (error) {
      this.logger.error('Lỗi khi tặng quà chào mừng', error);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async validateSocialLogin(
    profile: {
      email: string;
      firstName: string;
      lastName: string;
      picture?: string;
      provider: 'google' | 'facebook';
      socialId: string;
    },
    fingerprint?: string,
  ) {
    const { email, firstName, lastName, picture, provider, socialId } = profile;

    if (!email) {
      throw new BadRequestException('Email là bắt buộc khi đăng nhập qua MXH');
    }

    const tenant = getTenant();
    let user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant?.id,
      },
      select: this.USER_SELECT_WITH_SECRETS, // Need password for social login validation
    });

    if (user) {
      // Nếu user đã tồn tại nhưng chưa link Social ID -> Update
      if (!user.socialId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            provider,
            socialId,
            avatarUrl: picture || user.avatarUrl,
          },
        });
      }
    } else {
      // [BẢO MẬT] Kiểm tra xem Tenant có cho phép tự động đăng ký qua Social không
      const tenantDetails = await this.prisma.tenant.findUnique({
        where: { id: tenant!.id },
        select: { allowSocialRegistration: true },
      });

      if (!tenantDetails?.allowSocialRegistration) {
        throw new UnauthorizedException(
          'Cửa hàng này không cho phép tự động đăng ký qua mạng xã hội. Vui lòng liên hệ quản trị viên.',
        );
      }

      // Nếu user chưa tồn tại -> Tạo mới (Auto Register)
      const newUser = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          provider,
          socialId,
          avatarUrl: picture,
          tenantId: tenant!.id,
        },
      });

      if (!newUser) throw new UnauthorizedException('Không thể tạo tài khoản');
      await this.ensureGuestRoleAndAssign(newUser.id);

      // Reload để lấy đủ permission
      user = await this.prisma.user.findFirst({
        where: { id: newUser.id },
        select: this.USER_SELECT_WITH_SECRETS, // Need password for social login validation
      });

      if (user) {
        await this.grantWelcomeVoucher(user.id).catch((err) =>
          this.logger.error('Lỗi tặng quà chào mừng cho user MXH', err),
        );
      }
    }

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy User');
    }

    // [BẢO MẬT] Kiểm tra Tenant: Tránh login nhầm cửa hàng
    const currentTenant = getTenant();
    if (currentTenant && user.tenantId && user.tenantId !== currentTenant.id) {
      throw new UnauthorizedException(
        'Tài khoản này thuộc về cửa hàng khác, không thể đăng nhập tại đây',
      );
    }

    // Tổng hợp quyền hạn (Permissions)
    const allPermissions = this.permissionService.aggregatePermissions(user);

    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      allPermissions,
      user.roles.map((r) => r.role.name),
      fingerprint,
    );

    await this.redisService.set(
      `refreshToken:${user.id}`,
      refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((r) => r.role.name),
      },
    };
  }

  async login(dto: LoginDto, fingerprint?: string, ip?: string) {
    const { password } = dto;
    const email = dto.email.toLowerCase().trim();
    const tenant = getTenant();

    this.logger.log(
      `[AUTH] Đang xử lý đăng nhập: "${email}", Store: ${tenant?.domain || 'Global'}`,
    );

    // 1. Tìm user (Bỏ qua filter tenantId mặc định để check chéo nếu cần)
    const user = await this.findUserByEmailUnfiltered(email);

    if (!user) {
      this.logger.warn(`[AUTH] Không tìm thấy user: ${email}`);
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    // 2. Validate Mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      this.logger.warn(`[AUTH] Sai mật khẩu: ${email}`);
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    // 3. Tổng hợp quyền hạn (Roles & Permissions)
    // 3. Tổng hợp quyền hạn (Roles & Permissions)
    const roles = user.roles.map((r) => r.role.name);
    const allPermissions = this.permissionService.aggregatePermissions(
      user, // User from query has proper type with permissions
    );

    // 4. Kiểm tra quyền truy cập (Quan trọng cho Multi-tenancy)
    this.validateTenancyAccess(user, tenant, roles, allPermissions);

    // Kiểm tra IP Whitelist (nếu có cấu hình)
    this.validateIpWhitelist(user, ip);

    // 5. Kiểm tra 2FA (Bảo mật 2 lớp)
    if (user.twoFactorEnabled) {
      this.logger.log(`[AUTH] Yêu cầu 2FA: ${email}`);
      return { mfaRequired: true, userId: user.id };
    }

    // 6. Tạo Session (Tokens)
    const tokens = this.tokenService.generateTokens(
      user.id,
      allPermissions,
      roles,
      fingerprint,
    );

    await this.redisService.set(
      `refreshToken:${user.id}`,
      tokens.refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    this.logger.log(`[AUTH] Đăng nhập thành công: ${email}`);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  /**
   * Finds a user by email across all tenants.
   */
  private async findUserByEmailUnfiltered(email: string) {
    return tenantStorage.run(undefined, () =>
      this.prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          deletedAt: null,
        },
        select: this.USER_SELECT_WITH_SECRETS, // Need password for social login validation
      }),
    );
  }

  /**
   * Kiểm tra quyền truy cập vào Tenant hiện tại (Store Isolation).
   * - User thường: Chỉ vào được Tenant của mình.
   */
  private validateTenancyAccess(
    user: { tenantId: string; email: string },
    currentTenant: any,
    roles: string[],
    permissions: string[],
  ) {
    const isSuperAdmin = roles.includes('SUPERADMIN');
    const hasPlatformControl = permissions.includes('super-admin:read');

    // PLATFORM ADMIN = Super Admin + Có quyền hệ thống.
    // Được phép truy cập mọi Tenant và trang quản trị tổng (Global Portal).
    const isPlatformAdmin = isSuperAdmin && hasPlatformControl;

    if (currentTenant) {
      // Đang truy cập vào một cửa hàng cụ thể (Store Domain)
      if (user.tenantId !== currentTenant.id && !isPlatformAdmin) {
        this.logger.warn(
          `[AUTH-TENANCY] Bị chặn: User ${user.email} (Tenant: ${user.tenantId}) cố gắng truy cập Tenant: ${currentTenant.id}`,
        );
        throw new UnauthorizedException(
          'Tài khoản không thuộc về cửa hàng này',
        );
      }
    } else {
      // Đang truy cập trang quản trị hệ thống (Global/Platform Portal)
      if (!isPlatformAdmin) {
        this.logger.warn(
          `[AUTH-TENANCY] Bị chặn: User thường ${user.email} cố gắng truy cập Platform Portal`,
        );
        throw new UnauthorizedException(
          'Chỉ quản trị viên cấp cao mới có quyền truy cập trang này',
        );
      }
    }
  }

  /**
   * Kiểm tra IP User có nằm trong danh sách cho phép không (nếu đã cấu hình).
   */
  private validateIpWhitelist(
    user: { email: string; whitelistedIps?: any },
    currentIp?: string,
  ) {
    const whitelistedIps = user.whitelistedIps as string[];
    if (
      whitelistedIps?.length > 0 &&
      currentIp &&
      !whitelistedIps.includes(currentIp)
    ) {
      this.logger.warn(
        `[AUTH-SECURITY] IP Bị chặn: ${user.email} từ ${currentIp}`,
      );
      throw new UnauthorizedException('Truy cập bị từ chối từ địa chỉ IP này');
    }
  }

  async verify2FALogin(userId: string, token: string, fingerprint?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: this.USER_SELECT_WITH_SECRETS, // Need password for social login validation
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA không khả dụng cho tài khoản này');
    }

    const isValid = this.twoFactorService.verifyToken(
      token,
      user.twoFactorSecret,
    );
    if (!isValid) {
      throw new UnauthorizedException('Mã xác thực không hợp lệ');
    }

    // Tổng hợp quyền hạn khi 2FA thành công
    const allPermissions = this.permissionService.aggregatePermissions(user);

    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      allPermissions,
      user.roles.map((r) => r.role.name),
      fingerprint,
    );

    await this.redisService.set(
      `refreshToken:${user.id}`,
      refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string, jti?: string) {
    if (jti) {
      // Blacklist the specific token JTI for security
      await this.redisService.set(`jwt:revoked:${jti}`, 'true', 'EX', 900); // 15 mins matches common access token life
    }
    await this.redisService.del(`refreshToken:${userId}`);
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshToken: string, currentFingerprint?: string) {
    const decoded = this.tokenService.validateRefreshToken(refreshToken);

    if (!decoded || !decoded.userId) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    // [BẢO MẬT] CHECK FINGERPRINT (Chống trộm token)
    if (decoded.fp && currentFingerprint && decoded.fp !== currentFingerprint) {
      // Phát hiện dấu hiệu trộm token (Device không khớp)
      // Lý tưởng: Thu hồi tất cả token của user này.
      // Hiện tại: Chặn request này.
      this.logger.warn(
        `Phát hiện nghi vấn trộm token của user ${decoded.userId}`,
      );
      throw new UnauthorizedException('Token không hợp lệ (Lỗi Fingerprint)');
    }

    const userId = decoded.userId;

    const storedToken = await this.redisService.get(`refreshToken:${userId}`);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã bị thu hồi',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: this.USER_SELECT_WITH_SECRETS, // Need password for social login validation
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    // Luôn update quyền hạn mới nhất mỗi khi refresh token
    const allPermissions = this.permissionService.aggregatePermissions(user);

    const tokens = this.tokenService.generateTokens(
      userId,
      allPermissions,
      user.roles.map((r) => r.role.name),
      currentFingerprint, // Duy trì binding với thiết bị hiện tại
    );

    await this.redisService.set(
      `refreshToken:${userId}`,
      tokens.refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    return tokens;
  }

  async updateProfile(userId: string, dto: any) {
    if (!dto) {
      throw new BadRequestException('Request body is empty');
    }
    const { roles, email, password, newPassword, ...updateData } = dto;

    if (password && newPassword) {
      const user = await this.prisma.user.findFirst({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');

      if (!user.password) {
        throw new BadRequestException(
          'User has no password set (Social Login)',
        );
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
      }

      const hashedPassword = await bcrypt.hash(
        newPassword,
        AUTH_CONFIG.BCRYPT_ROUNDS,
      );

      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Send confirmation email
      await this.emailService.sendPasswordResetSuccess(user.email);
    }

    if (Object.keys(updateData).length > 0) {
      return this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: {
        ...this.USER_SELECT_SAFE, // Safe for public API response
        addresses: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return new UserEntity(user as any);
  }

  async checkEmailExistence(
    email: string,
  ): Promise<{ existsInDb: boolean; validDomain: boolean }> {
    const dbCount = await this.prisma.user.count({ where: { email } });

    let validDomain = false;
    try {
      const domain = email.split('@')[1];
      if (domain) {
        const mxRecords = await resolveMx(domain);
        validDomain = mxRecords && mxRecords.length > 0;
      }
    } catch (error) {
      validDomain = false;
    }

    return {
      existsInDb: dbCount > 0,
      validDomain,
    };
  }

  /**
   * Helper xác thực miền Email (MX Record)
   * @throws BadRequestException nếu domain không hợp lệ hoặc không nhận email
   */
  async verifyEmailDomain(email: string) {
    if (process.env.NODE_ENV === 'test') return true;
    try {
      const domain = email.split('@')[1];
      if (!domain) return false;

      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        throw new BadRequestException(
          `Tên miền email '${domain}' không hợp lệ (Không có bản ghi MX)`,
        );
      }
      return true;
    } catch (error) {
      // network errors or no records
      if (error instanceof BadRequestException) throw error;
      // Code ENODATA or ENOTFOUND means no MX
      throw new BadRequestException(
        `Tên miền email không hợp lệ: ${email.split('@')[1]}`,
      );
    }
  }

  /**
   * Internal Helper: Retrieve raw user by ID with secrets (password, 2FA secret).
   * DO NOT Expose this to Controller Response.
   */
  async getUserWithSecrets(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: this.USER_SELECT_WITH_SECRETS, // Need password for social login validation
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async forgotPassword(email: string) {
    const tenant = getTenant();
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant?.id,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(`reset_password:${token}`, user.id, 'EX', 3600); // 1 hour

    await this.emailService.sendPasswordReset(user.email, token);

    return { message: 'Email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.redisService.get(`reset_password:${token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      AUTH_CONFIG.BCRYPT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.redisService.del(`reset_password:${token}`);

    // Send confirmation email
    await this.emailService.sendPasswordResetSuccess(user.email);

    return { message: 'Password updated' };
  }

  private async grantWelcomeVoucher(userId: string) {
    try {
      const result = await this.promotionsService.grantWelcomeVoucher(userId);
      if (result) {
        // Phát sự kiện để NotificationsService xử lý gửi thông báo
        this.eventEmitter.emit('user.welcome_gift_granted', result);
      }
    } catch (error) {
      this.logger.error('Lỗi khi xử lý quà chào mừng', error);
    }
  }

  private async ensureGuestRoleAndAssign(userId: string) {
    const tenant = getTenant();
    if (!tenant) return;

    let guestRole = await this.prisma.role.findFirst({
      where: { name: 'GUEST', tenantId: tenant.id },
    });

    if (!guestRole) {
      const guestPermissions = [
        'product:read',
        'category:read',
        'brand:read',
        'blog:read',
        'review:read',
        'review:create',
        'order:read',
        'order:create',
        'notification:read',
        'coupon:read',
      ];

      const permissionRecords = await Promise.all(
        guestPermissions.map((pName) =>
          this.prisma.permission.upsert({
            where: { name: pName },
            update: {},
            create: { name: pName },
          }),
        ),
      );

      guestRole = await this.prisma.role.create({
        data: {
          name: 'GUEST',
          tenantId: tenant.id,
          permissions: {
            create: permissionRecords.map((p) => ({
              permissionId: p.id,
            })),
          },
        },
      });
    }

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: guestRole.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: guestRole.id,
      },
    });
  }
}
