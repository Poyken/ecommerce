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
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserEntity } from './entities/user.entity';
import { TokenService } from './token.service';

/**
 * =====================================================================
 * AUTH SERVICE - Trái tim của hệ thống bảo mật
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PASSWORD HASHING (Mã hóa mật khẩu):
 * - Tuyệt đối không bao giờ lưu mật khẩu dạng văn bản thuần túy (Plaintext).
 * - Sử dụng `bcrypt` với độ khó (salt) là 10 để mã hóa. Ngay cả Admin cũng không thể biết mật khẩu thật của người dùng.
 *
 * 2. HYBRID RBAC (Phân quyền lai):
 * - Hệ thống hỗ trợ cả quyền thừa kế từ Role (VD: Admin có quyền sửa sản phẩm) và quyền gán trực tiếp cho User.
 * - Logic gộp quyền (`allPermissions`) giúp linh hoạt tối đa trong việc quản lý nhân sự.
 *
 * 3. TOKEN ROTATION & REDIS:
 * - Refresh Token được lưu vào Redis. Khi người dùng lấy Access Token mới, ta có thể xoay vòng (Rotate) Refresh Token để tăng tính bảo mật.
 * - Nếu hacker lấy được Refresh Token cũ, nó sẽ không còn tác dụng vì Redis đã cập nhật cái mới.
 *
 * 4. ASYNC NOTIFICATIONS:
 * - Khi quên mật khẩu, ta không gửi email trực tiếp (vì sẽ làm chậm API).
 * - Thay vào đó, ta đẩy một "Job" vào `emailQueue` (BullMQ) để xử lý ngầm.
 *
 * 5. SECURITY BEST PRACTICES:
 * - `UserEntity`: Sử dụng class-transformer để tự động ẩn trường `password` khi trả về dữ liệu cho Client.
 * - `crypto.randomBytes`: Tạo ra các chuỗi Token ngẫu nhiên cực kỳ khó đoán cho việc khôi phục mật khẩu.
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
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Đăng ký người dùng mới.
   * - Kiểm tra email trùng lặp.
   * - Mã hóa mật khẩu (hashing).
   * - Tạo user trong DB.
   * - Sinh cặp token ban đầu và lưu vào Redis.
   */
  async register(dto: RegisterDto) {
    const { email, password, firstName, lastName } = dto;

    // 1. Kiểm tra xem email đã tồn tại chưa
    const existsUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existsUser) {
      throw new ConflictException('User already exists');
    }

    // 2. Mã hóa mật khẩu (Độ khó salt: 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tạo user mới trong Database
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    // 3.1. Gán Role GUEST mặc định
    await this.ensureGuestRoleAndAssign(user.id);

    // 4. Sinh Access Token và Refresh Token
    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
    );

    // 5. Lưu Refresh Token vào Redis (Key: UserID) để quản lý phiên đăng nhập
    await this.redisService.set(
      `refreshToken:${user.id}`,
      refreshToken,
      'EX', // Đặt thời gian hết hạn (TTL) khớp với cấu hình JWT
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    // 6. Tặng Voucher chào mừng & Gửi thông báo
    try {
      await this.grantWelcomeVoucher(user.id);
    } catch (error) {
      console.error('Failed to process post-registration tasks', error);
    }

    return { accessToken, refreshToken };
  }

  /**
   * Xử lý đăng nhập qua Mạng xã hội (Google, Facebook)
   */
  async validateSocialLogin(profile: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
    provider: 'google' | 'facebook';
    socialId: string;
  }) {
    const { email, firstName, lastName, picture, provider, socialId } = profile;

    if (!email) {
      throw new BadRequestException('Email is required from social provider');
    }

    // 1. Tìm user trong DB theo email
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
      // Nếu user đã tồn tại, cập nhật thông tin Social nếu chưa có
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
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          provider,
          socialId,
          avatarUrl: picture,
          // Không set password
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
      });

      // 2.1. Gán Role GUEST mặc định cho user mới
      await this.ensureGuestRoleAndAssign(user.id);

      // Reload user để lấy roles mới gán
      const reloadedUser = await this.prisma.user.findUnique({
        where: { id: user.id },
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

      if (!reloadedUser) {
        throw new UnauthorizedException('User not found after creation');
      }
      user = reloadedUser as any;

      // 2.2. Tặng Voucher chào mừng cho user mới đăng ký qua Social
      await this.grantWelcomeVoucher(reloadedUser.id).catch((err) =>
        console.error('Failed to grant social welcome voucher', err),
      );
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3. Quy trình sinh Token giống Login thường
    const directPerms = user.permissions.map((up) => up.permission.name);
    const rolePerms = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );
    const allPermissions = [...new Set([...directPerms, ...rolePerms])];

    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      allPermissions,
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

  /**
   * Đăng nhập người dùng.
   * - Xác thực email và mật khẩu.
   * - Lấy danh sách quyền (Permission) tổng hợp.
   * - Trả về token và thông tin user (đã ẩn password).
   */
  async login(dto: LoginDto) {
    const { email, password } = dto;

    // 1. Tìm user theo email, kèm theo thông tin Roles và Permissions
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        permissions: { include: { permission: true } }, // Quyền riêng
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } }, // Quyền của Role
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. So sánh mật khẩu nhập vào với mật khẩu đã mã hóa trong DB
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Tổng hợp quyền (RBAC Hybrid)
    // A. Lấy quyền trực tiếp
    const directPerms = user.permissions.map((up) => up.permission.name);

    // B. Lấy quyền thừa kế từ Roles
    const rolePerms = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );

    // C. Gộp lại và loại bỏ trùng lặp
    const allPermissions = [...new Set([...directPerms, ...rolePerms])];

    // 4. Sinh Token (Nhúng permission vào Access Token để check nhanh)
    const { accessToken, refreshToken } = this.tokenService.generateTokens(
      user.id,
      allPermissions,
    );

    // 5. Cập nhật Refresh Token mới vào Redis (Ghi đè token cũ -> Đăng xuất thiết bị cũ nếu Single Session)
    await this.redisService.set(
      `refreshToken:${user.id}`,
      refreshToken,
      'EX',
      this.tokenService.getRefreshTokenExpirationTime(),
    );

    return {
      accessToken,
      refreshToken,
      // user: new UserEntity(user), // Serialize: Ẩn password trước khi trả về
    };
  }

  /**
   * Đăng xuất.
   * - Xóa Refresh Token trong Redis -> User không thể xin Access Token mới được nữa.
   */
  async logout(userId: string) {
    await this.redisService.del(`refreshToken:${userId}`);
    return { message: 'Logged out successfully' };
  }

  /**
   * Cấp lại cặp Token mới (Refresh Token Rotation).
   * - Revoke (hủy) token cũ -> Cấp token mới.
   * - Query lại DB để đảm bảo quyền user là mới nhất.
   */
  async refreshTokens(refreshToken: string) {
    // 1. Verify chữ ký JWT của Refresh Token trước để lấy userId
    const decoded = this.tokenService.validateRefreshToken(refreshToken);

    if (!decoded || !decoded.userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = decoded.userId;

    // 2. Lấy token đang lưu trong Redis ra
    const storedToken = await this.redisService.get(`refreshToken:${userId}`);

    // 3. Kiểm tra xem Redis có còn giữ token không và token gửi lên có khớp không
    if (!storedToken || storedToken !== refreshToken) {
      // Nếu không khớp -> Có thể là hacker đang dùng token cũ hoặc đã bị logout rồi
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 4. Query lại DB để lấy quyền mới nhất (Security Check)
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

    // Tổng hợp lại quyền
    const directPerms = user.permissions.map((up) => up.permission.name);
    const rolePerms = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );
    const allPermissions = [...new Set([...directPerms, ...rolePerms])];

    // 5. Sinh cặp token mới
    const tokens = this.tokenService.generateTokens(userId, allPermissions);

    // 6. Lưu token mới vào Redis (Xoay vòng - Rotation)
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
      // 1. Lấy thông tin user để lấy mã hash mật khẩu hiện tại
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');

      // 2. Xác thực mật khẩu hiện tại
      if (!user.password) {
        throw new BadRequestException(
          'User has no password set (Social Login)',
        );
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
      }

      // 3. Mã hóa mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 4. Cập nhật mật khẩu
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    }

    // Cập nhật các trường thông tin khác nếu có
    if (Object.keys(updateData).length > 0) {
      return this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return { success: true };
  }

  /**
   * Lấy thông tin Profile của User hiện tại.
   * - Query DB để lấy dữ liệu mới nhất (bao gồm Roles & Permissions).
   * - Trả về qua UserEntity để ẩn password.
   */
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

    return new UserEntity(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    // Token hết hạn sau 15 phút (900 giây)
    await this.redisService.set(`reset_password:${token}`, user.id, 'EX', 900);

    await this.emailQueue.add('send-email', {
      email: user.email,
      type: 'reset-password',
      token,
    });

    return { message: 'Email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.redisService.get(`reset_password:${token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.redisService.del(`reset_password:${token}`);
    return { message: 'Password updated' };
  }

  /**
   * Tặng voucher chào mừng cho người dùng mới.
   * - Giảm 50.000đ (FIXED_AMOUNT).
   * - Thời hạn 1 tuần.
   * - Giới hạn 1 lần sử dụng.
   */
  private async grantWelcomeVoucher(userId: string) {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 7); // 1 tuần kể từ ngày đăng ký

    // Tạo mã code ngẫu nhiên (VD: WELCOME-A1B2C3)
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const couponCode = `WELCOME-${randomSuffix}`;

    // 1. Tạo Coupon trong DB
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

    // 2. Gửi thông báo cho User
    const notification = await this.notificationsService.create({
      userId,
      type: 'SYSTEM',
      title: 'Quà tặng chào mừng thành viên mới! 🎁',
      message: `Chào mừng bạn! Tặng bạn mã giảm giá ${couponCode} trị giá 50.000đ. Hạn sử dụng trong 1 tuần. Hãy mua sắm ngay!`,
      link: '/profile', // Dẫn về trang cá nhân để xem voucher
    });

    this.notificationsGateway.sendNotificationToUser(userId, notification);

    return coupon;
  }

  /**
   * Đảm bảo Role GUEST tồn tại và gán cho người dùng.
   * Nếu chưa có role GUEST, tạo mới với các quyền cơ bản.
   */
  private async ensureGuestRoleAndAssign(userId: string) {
    let guestRole = await this.prisma.role.findUnique({
      where: { name: 'GUEST' },
    });

    if (!guestRole) {
      // Danh sách quyền hợp lý cho GUEST (Người dùng mới/Khách hàng)
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

      // Đảm bảo các quyền này tồn tại trong DB
      const permissionRecords = await Promise.all(
        guestPermissions.map((pName) =>
          this.prisma.permission.upsert({
            where: { name: pName },
            update: {},
            create: { name: pName },
          }),
        ),
      );

      // Tạo Role GUEST và gán quyền
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

    // Gán Role cho User
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
