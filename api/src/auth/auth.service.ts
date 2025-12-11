import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserEntity } from './entities/user.entity';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
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

    return { accessToken, refreshToken };
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
    const { roles, email, password, newPassword, ...updateData } = dto;

    if (password && newPassword) {
      // 1. Fetch user to get current password hash
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');

      // 2. Verify current password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
      }

      // 3. Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 4. Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    }

    // Update other profile fields if present
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
}
