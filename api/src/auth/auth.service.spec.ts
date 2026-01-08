import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { TokenService } from './token.service';
import { RedisService } from '@core/redis/redis.service';
import { TwoFactorService } from './two-factor.service';
import { PermissionService } from './permission.service';
import { EmailService } from '@integrations/email/email.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { getQueueToken } from '@nestjs/bullmq';
import { RegisterDto } from './dto/register.dto';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('@core/tenant/tenant.context', () => ({
  getTenant: jest.fn().mockReturnValue({ id: 'tenant-123' }),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let tokenService: TokenService;
  let redisService: RedisService;
  let permissionService: PermissionService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    userRole: {
      upsert: jest.fn(),
    },
    coupon: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      findFirst: jest.fn(),
    },
  };

  const mockTokenService = {
    generateTokens: jest.fn(),
    getRefreshTokenExpirationTime: jest.fn().mockReturnValue(3600),
    validateRefreshToken: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockTwoFactorService = {
    verifyToken: jest.fn(),
  };
  const mockPermissionService = {
    aggregatePermissions: jest.fn(),
  };
  const mockEmailService = {
    sendPasswordReset: jest.fn(),
    sendPasswordResetSuccess: jest.fn(),
  };
  const mockNotificationsService = {
    create: jest.fn(),
  };
  const mockNotificationsGateway = {
    sendNotificationToUser: jest.fn(),
  };
  const mockQueue = {};

  beforeEach(async () => {
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
    prismaService = module.get<PrismaService>(PrismaService);
    tokenService = module.get<TokenService>(TokenService);
    redisService = module.get<RedisService>(RedisService);
    permissionService = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      // Mock verifyEmailDomain to return true (by mocking resolveMx or the method itself if possible, but here we can spyOn the service method if we want, or mock the dns import.
      // Since verifyEmailDomain is private/protected or hard to mock external import directly without jest.mock, let's look at the implementation.
      // It uses `resolveMx` from `dns/promises`. We might need to mock that if the test actually runs it.
      // However, seeing `verifyEmailDomain` is an async method on the service, we can spy on it and mockImplementation if it were public, or mock the dns module.
      // Let's rely on mocking `service.verifyEmailDomain` logic by bypassing it or mocking dependencies.

      // Let's attempt to spyOn the method even if private (using as any) or rely on mocking the dns call.
      // Easiest is to mock dns/promises.

      jest.spyOn(service, 'verifyEmailDomain').mockResolvedValue(true);

      mockPrismaService.user.findFirst.mockResolvedValue(null); // User not exists

      const createdUser = { id: 'user-123', ...dto };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      mockPrismaService.role.findFirst.mockResolvedValue({
        id: 'role-guest',
        name: 'GUEST',
      });

      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Mock grantWelcomeVoucher internal logic mocks
      mockPrismaService.coupon.findFirst.mockResolvedValue(null);
      mockPrismaService.notification.findFirst.mockResolvedValue(null);
      mockPrismaService.coupon.create.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'refreshToken:user-123',
        'refresh-token',
        'EX',
        3600,
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      const dto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      jest.spyOn(service, 'verifyEmailDomain').mockResolvedValue(true);
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'existing-id',
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        roles: [{ role: { name: 'USER' } }],
      };

      mockPrismaService.user.findFirst.mockResolvedValue(user);
      // Mock bcrypt
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockPermissionService.aggregatePermissions = jest
        .fn()
        .mockReturnValue([]);
      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.login(dto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const dto = { email: 'test@example.com', password: 'wrong' };
      const user = {
        id: 'user-1',
        password: 'hashed-password',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow('Invalid credentials'); // Checking message strictly requires importing UnauthorizedException or using toThrow error
      // Note: In strict mode, might need to import UnauthorizedException
    });
  });

  describe('validateSocialLogin', () => {
    it('should register a new social user if not exists', async () => {
      const profile = {
        email: 'social@example.com',
        firstName: 'Social',
        lastName: 'User',
        provider: 'google' as const,
        socialId: 'google-123',
        picture: 'pic.jpg',
      };

      jest.spyOn(service, 'verifyEmailDomain').mockResolvedValue(true);
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce(null) // First check: find by email (not found)
        .mockResolvedValueOnce({
          id: 'social-1',
          ...profile,
          roles: [{ role: { name: 'GUEST' } }],
        }); // Reload

      mockPrismaService.user.create.mockResolvedValue({
        id: 'social-1',
        ...profile,
      });
      mockPermissionService.aggregatePermissions.mockReturnValue([]);
      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      mockPrismaService.role.findFirst.mockResolvedValue({
        id: 'role-guest',
        name: 'GUEST',
      });

      // Mock internal coupon create
      mockPrismaService.coupon.findFirst.mockResolvedValue(null);
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      const result = await service.validateSocialLogin(profile);

      expect(result).toHaveProperty('accessToken');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should login existing social user', async () => {
      const profile = {
        email: 'social@example.com',
        firstName: 'Social',
        lastName: 'User',
        provider: 'google' as const,
        socialId: 'google-123',
        picture: 'pic.jpg',
      };

      const existingUser = {
        id: 'user-1',
        email: 'social@example.com',
        socialId: 'google-123',
        roles: [{ role: { name: 'USER' } }],
      };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);
      mockPermissionService.aggregatePermissions.mockReturnValue([]);
      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.validateSocialLogin(profile);
      expect(result.accessToken).toBe('access-token');
      // Should NOT update unless missing info, here socialId matches
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequest if email is missing', async () => {
      await expect(service.validateSocialLogin({} as any)).rejects.toThrow();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens if valid', async () => {
      mockTokenService.validateRefreshToken = jest
        .fn()
        .mockReturnValue({ userId: 'user-1', fp: 'fp1' });
      mockRedisService.get = jest.fn().mockResolvedValue('valid-refresh-token');

      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        roles: [],
      });
      mockPermissionService.aggregatePermissions.mockReturnValue([]);
      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'new',
        refreshToken: 'new-r',
      });
      const result = await service.refreshTokens('valid-refresh-token', 'fp1');
      expect(result).toEqual({ accessToken: 'new', refreshToken: 'new-r' });
    });

    it('should throw Unauthorized if token invalid', async () => {
      mockTokenService.validateRefreshToken = jest.fn().mockReturnValue(null);
      await expect(service.refreshTokens('bad')).rejects.toThrow();
    });
  });

  describe('checkEmailExistence', () => {
    it('should return existsInDb true if user exists', async () => {
      mockPrismaService.user.count = jest.fn().mockResolvedValue(1);
      const result = await service.checkEmailExistence('test@example.com');
      expect(result.existsInDb).toBe(true);
    });

    it('should return existsInDb false if user does not exist', async () => {
      mockPrismaService.user.count = jest.fn().mockResolvedValue(0);
      const result = await service.checkEmailExistence('test@example.com');
      expect(result.existsInDb).toBe(false);
    });
  });

  describe('forgotPassword', () => {
    it('should send email if user exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });
      await service.forgotPassword('test@example.com');
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(
        service.forgotPassword('test@example.com'),
      ).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockRedisService.get.mockResolvedValue('user-1');
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      await service.resetPassword('valid-token', 'new-pass');

      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetSuccess).toHaveBeenCalled();
    });

    it('should throw BadRequest for invalid token', async () => {
      mockRedisService.get.mockResolvedValue(null);
      await expect(service.resetPassword('invalid', 'pass')).rejects.toThrow();
    });
  });

  describe('getMe', () => {
    it('should return user entity', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'me',
      });
      const result = await service.getMe('user-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });
  });

  describe('logout', () => {
    it('should remove refresh token', async () => {
      await service.logout('user-1', 'jti');
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalled(); // blacklist jti
    });
  });

  describe('verify2FALogin', () => {
    it('should return tokens if 2FA valid', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'u1',
        twoFactorEnabled: true,
        twoFactorSecret: 's',
        roles: [],
      });
      mockTwoFactorService.verifyToken.mockReturnValue(true);
      mockPermissionService.aggregatePermissions.mockReturnValue([]);
      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'a',
        refreshToken: 'r',
      });

      const result = await service.verify2FALogin('u1', '123456');
      expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
    });

    it('should throw Unauthorized if 2FA invalid', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'u1',
        twoFactorEnabled: true,
        twoFactorSecret: 's',
      });
      mockTwoFactorService.verifyToken.mockReturnValue(false);
      await expect(service.verify2FALogin('u1', 'bad')).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update user fields', async () => {
      // Clean mock
      mockPrismaService.user.update.mockResolvedValue({});
      await service.updateProfile('u1', { firstName: 'New' });
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should update password if provided', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'u1',
        password: 'old-hash',
        email: 'e',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      await service.updateProfile('u1', {
        password: 'old',
        newPassword: 'new',
      });
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetSuccess).toHaveBeenCalled();
    });
  });
});
