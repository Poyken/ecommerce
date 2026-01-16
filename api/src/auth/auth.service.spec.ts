import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { PermissionService } from './permission.service';
import { EmailService } from '@integrations/email/email.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import * as bcrypt from 'bcrypt';

/**
 * =====================================================================
 * AUTH SERVICE UNIT TESTS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UNIT TEST VS INTEGRATION TEST:
 *    - Unit Test: Test từng method riêng lẻ, mock tất cả dependencies.
 *    - Integration Test: Test cả flow thực tế với DB thật.
 *    - File này là Unit Test: Nhanh, chạy độc lập, không cần DB.
 *
 * 2. MOCK:
 *    - Giả lập các service bên ngoài (Prisma, Redis, Email...).
 *    - Giúp test nhanh và kiểm soát được kết quả trả về.
 *
 * 3. ARRANGE - ACT - ASSERT (AAA):
 *    - Arrange: Chuẩn bị data, mock.
 *    - Act: Gọi method cần test.
 *    - Assert: Kiểm tra kết quả đúng mong đợi.
 *
 * =====================================================================
 */

jest.mock('dns/promises', () => ({
  resolveMx: jest
    .fn()
    .mockResolvedValue([{ exchange: 'mail.example.com', priority: 10 }]),
}));

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest
    .fn()
    .mockReturnValue({ id: 'tenant-123', domain: 'test.com' }),
  tenantStorage: {
    run: jest.fn((context, fn) => fn()),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let tokenService: jest.Mocked<TokenService>;
  let redisService: jest.Mocked<RedisService>;
  let emailService: jest.Mocked<EmailService>;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    tenantId: 'tenant-123',
    isTwoFactorEnabled: false,
    roles: [
      {
        role: {
          name: 'USER',
          permissions: [{ permission: { name: 'user:read' } }],
        },
      },
    ],
  };

  const mockTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    jti: 'jti-123',
  };

  beforeEach(async () => {
    // Create mock implementations
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ userId: 'user-123', roleId: 'role-id' }),
      },
      permission: {
        upsert: jest.fn(),
      },
      promotion: {
        findFirst: jest.fn(),
      },
      promotionUsage: {
        create: jest.fn(),
      },
      notification: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(mockPrismaService)),
    };

    const mockTokenService = {
      generateTokens: jest.fn().mockReturnValue(mockTokens),
      validateRefreshToken: jest.fn(),
      getRefreshTokenExpirationTime: jest.fn().mockReturnValue(3600),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockTwoFactorService = {
      verifyToken: jest.fn(),
    };

    const mockPermissionService = {
      getUserPermissions: jest.fn().mockResolvedValue(['user:read']),
      aggregatePermissions: jest.fn().mockReturnValue(['user:read']),
    };

    const mockEmailService = {
      sendWelcomeEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    const mockNotificationsService = {
      create: jest.fn(),
    };

    const mockNotificationsGateway = {
      sendNotificationToUser: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: TwoFactorService, useValue: mockTwoFactorService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
        { provide: getQueueToken('email-queue'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    tokenService = module.get(TokenService);
    redisService = module.get(RedisService);
    emailService = module.get(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =====================================================================
  // #region LOGIN TESTS
  // =====================================================================

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithPassword = { ...mockUser, password: hashedPassword };

      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValue(userWithPassword);

      // Act
      const result = await service.login(loginDto, 'fingerprint-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // Arrange
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.login(
          { ...loginDto, password: 'wrong-password' },
          'fingerprint',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto, 'fingerprint')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      // Act & Assert
      await expect(service.login(loginDto, 'fingerprint')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // #endregion

  // =====================================================================
  // #region REGISTER TESTS
  // =====================================================================

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null); // No existing user
      prismaService.user.create = jest.fn().mockResolvedValue({
        id: 'new-user-id',
        ...registerDto,
        password: 'hashed',
      });
      prismaService.role.findFirst = jest
        .fn()
        .mockResolvedValue({ id: 'role-id', name: 'USER' });
      prismaService.userRole.create = jest.fn().mockResolvedValue({});

      // Act
      const result = await service.register(registerDto, 'fingerprint');

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for existing email', async () => {
      // Arrange
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.register(registerDto, 'fingerprint'),
      ).rejects.toThrow('Email này đã được sử dụng');
    });
  });

  // #endregion

  // =====================================================================
  // #region LOGOUT TESTS
  // =====================================================================

  describe('logout', () => {
    it('should blacklist token on logout', async () => {
      // Act
      await service.logout('user-123', 'jti-123');

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        'jwt:revoked:jti-123',
        'true',
        'EX',
        900,
      );
      expect(redisService.del).toHaveBeenCalledWith('refreshToken:user-123');
    });

    it('should handle logout without jti gracefully', async () => {
      // Act
      await service.logout('user-123');

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('refreshToken:user-123');
    });
  });

  // #endregion

  // =====================================================================
  // #region REFRESH TOKEN TESTS
  // =====================================================================

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // Arrange
      tokenService.validateRefreshToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        jti: 'old-jti',
        fp: 'fingerprint-123',
      });
      redisService.get = jest.fn().mockResolvedValue(mockTokens.refreshToken);
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshTokens(
        mockTokens.refreshToken,
        'fingerprint-123',
      );

      // Assert
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      tokenService.validateRefreshToken = jest.fn().mockReturnValue(null);

      // Act & Assert
      await expect(
        service.refreshTokens('invalid-token', 'fingerprint'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for fingerprint mismatch', async () => {
      // Arrange
      tokenService.validateRefreshToken = jest.fn().mockReturnValue({
        userId: 'user-123',
        jti: 'old-jti',
        fp: 'original-fingerprint',
      });

      // Act & Assert
      await expect(
        service.refreshTokens('valid-token', 'different-fingerprint'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // #endregion

  // =====================================================================
  // #region GET ME TESTS
  // =====================================================================

  describe('getMe', () => {
    it('should return user profile', async () => {
      // Arrange
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await service.getMe('user-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw BadRequestException for non-existent user', async () => {
      // Arrange
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.getMe('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // #endregion
});
