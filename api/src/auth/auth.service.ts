import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { getTenant } from '@core/tenant/tenant.context'; // Import getTenant
import { EmailService } from '@integrations/email/email.service';
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

/**
 * =====================================================================
 * AUTH SERVICE - LOGIC XÁC THỰC
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERMISSION SYSTEM (Hệ thống phân quyền - RBAC):
 * - Hệ thống này sử dụng cơ chế quyền kết hợp (Hybrid Permissions):
 *   + Quyền trực tiếp (Direct Permissions): Gán thẳng vào User.
 *   + Quyền qua vai trò (Role-based Permissions): User -> Roles -> Permissions.
 * - Logic "Permission Flattening":
 *   Khi user đăng nhập, ta sẽ gộp tất cả quyền từ Role và quyền trực tiếp thành một mảng duy nhất -> Lưu vào Redis/Token để check nhanh sau này.
 *
 * 2. AUTHENTICATION FLOW:
 * - Bước 1: Validate email/password (Bcrypt compare).
 * - Bước 2: Kiểm tra 2FA (nếu user bật).
 * - Bước 3: Generate Tokens (Access + Refresh).
 * - Bước 4: Lưu Refresh Token vào Redis (để có thể thu hồi/revoke khi user logout).
 *
 * 3. SECURITY:
 * - Mật khẩu LUÔN được hash bằng `bcrypt` trước khi lưu DB.
 * - Refresh Token cũng được quản lý chặt chẽ kèm Fingerprint thiết bị.
 * =====================================================================
 */

import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
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
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private readonly USER_PERMISSION_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    socialId: true,
    password: true,
    tenantId: true, // Needed for security check
    twoFactorEnabled: true,
    twoFactorSecret: true,
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

  async register(dto: RegisterDto, fingerprint?: string) {
    const { email, password, firstName, lastName } = dto;

    // 1. Validate real email domain (MX Check)
    await this.verifyEmailDomain(email);

    const tenant = getTenant();
    const existsUser = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant?.id,
      },
    });
    if (existsUser) {
      throw new ConflictException('User already exists');
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
        tenantId: tenant!.id, // Tenant is guaranteed by middleware since tenantId is required
      },
    });

    await this.ensureGuestRoleAndAssign(user.id);

    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      [], // Permissions will be fetched/cached next time or derived?
      ['GUEST'], // New user has GUEST role
      fingerprint,
    );

    // To include permissions in the first token, reload user:
    // For now, let's stick to minimal change to avoid breaking.
    // Permissions in token are useful.

    await this.redisService.set(
      `refreshToken:${user.id}`,
      refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    try {
      await this.grantWelcomeVoucher(user.id);
    } catch (error) {
      this.logger.error('Failed to process post-registration tasks', error);
    }

    return { accessToken, refreshToken };
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
      throw new BadRequestException('Email is required from social provider');
    }

    const tenant = getTenant();
    let user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant?.id,
      },
      select: this.USER_PERMISSION_SELECT,
    });

    if (user) {
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
      user = (await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          provider,
          socialId,
          avatarUrl: picture,
          tenantId: tenant!.id,
        },
        select: this.USER_PERMISSION_SELECT,
      })) as any;

      if (!user) throw new UnauthorizedException('Failed to create user');
      await this.ensureGuestRoleAndAssign(user.id);

      const reloaded = await this.prisma.user.findFirst({
        where: { id: user.id },
        select: this.USER_PERMISSION_SELECT,
      });

      if (!reloaded) throw new UnauthorizedException('Failed to reload user');
      user = reloaded as any;

      if (user) {
        await this.grantWelcomeVoucher(user.id).catch((err) =>
          this.logger.error('Failed to grant social welcome voucher', err),
        );
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // [SECURITY] TENANT CHECK FOR SOCIAL LOGIN
    const currentTenant = getTenant();
    if (currentTenant && user.tenantId && user.tenantId !== currentTenant.id) {
      throw new UnauthorizedException(
        'Tài khoản xã hội này đã được liên kết với cửa hàng khác',
      );
    }

    // Use PermissionService for consistent permission aggregation
    const allPermissions = this.permissionService.aggregatePermissions(
      user as any,
    );

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

  async login(dto: LoginDto, fingerprint?: string) {
    const { email, password } = dto;

    const tenant = getTenant();
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant?.id, // Super admin is now also assigned to a tenant
      },
      select: this.USER_PERMISSION_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2FA CHECK
    if ((user as any).twoFactorEnabled) {
      return {
        mfaRequired: true,
        userId: user.id,
      };
    }

    // [SECURITY] TENANT CHECK
    // If request has a tenant context, user MUST belong to that tenant
    // Exception: Super Admin (no tenantId) can login anywhere (or restrict as needed)
    const currentTenant = getTenant();
    if (currentTenant) {
      // If user has a tenantId and it doesn't match currentTenant.id -> DENY
      // If user is Super Admin (tenantId=null) -> ALLOW (or enforce platform domain check if needed)
      if (user.tenantId && user.tenantId !== currentTenant.id) {
        throw new UnauthorizedException(
          'Tài khoản không thuộc về cửa hàng này',
        );
      }

      // OPTIONAL: If user has NO tenantId (Super Admin) but trying to login to a specific store?
      // For now, assume Super Admin can access tenant dashboards.
    }

    // Use PermissionService for consistent permission aggregation
    const allPermissions = this.permissionService.aggregatePermissions(
      user as any,
    );

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

  async verify2FALogin(userId: string, token: string, fingerprint?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: this.USER_PERMISSION_SELECT,
    });

    if (
      !user ||
      !(user as any).twoFactorEnabled ||
      !(user as any).twoFactorSecret
    ) {
      throw new UnauthorizedException('2FA không khả dụng cho tài khoản này');
    }

    const isValid = this.twoFactorService.verifyToken(
      token,
      (user as any).twoFactorSecret,
    );
    if (!isValid) {
      throw new UnauthorizedException('Mã xác thực không hợp lệ');
    }

    // Use PermissionService for consistent permission aggregation
    const allPermissions = this.permissionService.aggregatePermissions(
      user as any,
    );

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
      throw new UnauthorizedException('Invalid refresh token');
    }

    // CHECK FINGERPRINT
    if (decoded.fp && currentFingerprint && decoded.fp !== currentFingerprint) {
      // Potential Token Theft!
      // We should invalidate all tokens for this user ideally.
      // For now, just reject.
      this.logger.warn(
        `Suspicious refresh attempt defined for user ${decoded.userId}`,
      );
      throw new UnauthorizedException('Invalid refresh token (FP)');
    }

    const userId = decoded.userId;

    const storedToken = await this.redisService.get(`refreshToken:${userId}`);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: this.USER_PERMISSION_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Use PermissionService for consistent permission aggregation
    const allPermissions = this.permissionService.aggregatePermissions(
      user as any,
    );

    const tokens = this.tokenService.generateTokens(
      userId,
      allPermissions,
      user.roles.map((r) => r.role.name),
      currentFingerprint, // Maintain binding to current device
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
        ...this.USER_PERMISSION_SELECT,
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
   * Helper to verify if email domain has valid MX records
   * @throws BadRequestException if domain is invalid
   */
  async verifyEmailDomain(email: string) {
    try {
      const domain = email.split('@')[1];
      if (!domain) return false;

      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        throw new BadRequestException(
          `Email domain '${domain}' does not accept emails (No MX records)`,
        );
      }
      return true;
    } catch (error) {
      // network errors or no records
      if (error instanceof BadRequestException) throw error;
      // Code ENODATA or ENOTFOUND means no MX
      throw new BadRequestException(
        `Invalid email domain: ${email.split('@')[1]}`,
      );
    }
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
    // Check if user already has a welcome voucher (to prevent duplicates)
    // Check via orders relation - if user has used any WELCOME coupon
    const existingWelcomeCoupon = await this.prisma.coupon.findFirst({
      where: {
        code: { startsWith: 'WELCOME-' },
        orders: {
          some: { userId },
        },
      },
    });

    // Also check for coupons created with notification to this user
    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        userId,
        title: { contains: 'Quà tặng chào mừng' },
      },
    });

    if (existingWelcomeCoupon || existingNotification) {
      this.logger.log(
        `User ${userId} already has a welcome voucher, skipping...`,
      );
      return null;
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 7);

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const couponCode = `WELCOME-${randomSuffix}`;

    const tenant = getTenant();
    const coupon = await this.prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'FIXED_AMOUNT',
        discountValue: 50000,
        description: 'Voucher chào mừng thành viên mới',
        startDate: now,
        endDate: endDate,
        usageLimit: 1,
        isActive: true,
        tenantId: tenant!.id,
      },
    });

    const notification = await this.notificationsService.create({
      userId,
      type: 'SYSTEM',
      title: 'Quà tặng chào mừng thành viên mới! 🎁',
      message: `Chào mừng bạn! Tặng bạn mã giảm giá ${couponCode} trị giá 50.000đ. Hạn sử dụng trong 1 tuần. Hãy mua sắm ngay!`,
      link: '/profile',
    });

    this.notificationsGateway.sendNotificationToUser(userId, notification);

    return coupon;
  }

  private async ensureGuestRoleAndAssign(userId: string) {
    let guestRole = await this.prisma.role.findUnique({
      where: { name: 'GUEST' },
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
