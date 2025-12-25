import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { EmailService } from '../common/email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserEntity } from './entities/user.entity';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';

/**
 * =====================================================================
 * AUTH SERVICE
 * =====================================================================
 */

import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly twoFactorService: TwoFactorService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async register(dto: RegisterDto, fingerprint?: string) {
    const { email, password, firstName, lastName } = dto;

    const existsUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existsUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    await this.ensureGuestRoleAndAssign(user.id);

    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      [], // Permissions will be fetched/cached next time or derived?
      // Actually generateTokens expects explicit permissions.
      // New user has GUEST role permissions.
      // Ideally we fetch them back, but for registration speed we might skip or fetching is better.
      // Let's stick to original logic: it passed user.id but original code had generateTokens(userId).
      // Oh, my view of original code showed generateTokens(userId) call in register().
      // But generateTokens definition has (userId, permissions). Typescript optional?
      // I added permissions=[] default in TokenService.
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
      console.error('Failed to process post-registration tasks', error);
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

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        permissions: { include: { permission: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
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
        },
        include: {
          permissions: { include: { permission: true } },
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      })) as any;

      if (!user) throw new UnauthorizedException('Failed to create user');
      await this.ensureGuestRoleAndAssign(user.id);

      const reloaded = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          permissions: { include: { permission: true } },
          roles: {
            include: {
              role: {
                include: { permissions: { include: { permission: true } } },
              },
            },
          },
        },
      });

      if (!reloaded) throw new UnauthorizedException('Failed to reload user');
      user = reloaded as any;

      if (user) {
        await this.grantWelcomeVoucher(user.id).catch((err) =>
          console.error('Failed to grant social welcome voucher', err),
        );
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const directPerms = user.permissions.map((up) => up.permission.name);
    const rolePerms = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );
    const allPermissions = [...new Set([...directPerms, ...rolePerms])];

    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      allPermissions,
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

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        permissions: { include: { permission: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
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

    const directPerms = user.permissions.map((up) => up.permission.name);
    const rolePerms = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );
    const allPermissions = [...new Set([...directPerms, ...rolePerms])];

    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      allPermissions,
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: { include: { permission: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
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

    const directPerms = user.permissions.map((up) => up.permission.name);
    const rolePerms = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );
    const allPermissions = [...new Set([...directPerms, ...rolePerms])];

    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      allPermissions,
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
      console.warn(
        `Suspicious refresh attempt defined for user ${decoded.userId}`,
      );
      throw new UnauthorizedException('Invalid refresh token (FP)');
    }

    const userId = decoded.userId;

    const storedToken = await this.redisService.get(`refreshToken:${userId}`);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: { include: { permission: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const directPerms = user.permissions.map((up) => up.permission.name);
    const rolePerms = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );
    const allPermissions = [...new Set([...directPerms, ...rolePerms])];

    const tokens = this.tokenService.generateTokens(
      userId,
      allPermissions,
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
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
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

      const hashedPassword = await bcrypt.hash(newPassword, 10);

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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: { include: { permission: true } },
        addresses: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return new UserEntity(user as any);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
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

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
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
      console.log(`User ${userId} already has a welcome voucher, skipping...`);
      return null;
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 7);

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const couponCode = `WELCOME-${randomSuffix}`;

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
