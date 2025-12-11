import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let tokenService: TokenService;
  let redisService: RedisService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockTokenService = {
    generateTokens: jest.fn(),
    getRefreshTokenExpirationTime: jest.fn().mockReturnValue(604800),
    validateRefreshToken: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    tokenService = module.get<TokenService>(TokenService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      const createdUser = {
        id: 'user-id',
        ...registerDto,
        password: 'hashedPassword',
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: 'hashedPassword',
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      });
      expect(redisService.set).toHaveBeenCalledWith(
        'refreshToken:user-id',
        'refresh-token',
        'EX',
        604800,
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: registerDto.email,
      });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: loginDto.email,
      password: 'hashedPassword',
      permissions: [],
      roles: [],
    };

    it('should successfully login user', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: loginDto.email } }),
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(redisService.set).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const userId = 'user-id';

      // Act
      const result = await service.logout(userId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(`refreshToken:${userId}`);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('refreshTokens', () => {
    const userId = 'user-id';
    const refreshToken = 'valid-refresh-token';

    const mockUser = {
      id: userId,
      permissions: [],
      roles: [],
    };

    it('should successfully refresh tokens', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(refreshToken);
      mockTokenService.validateRefreshToken.mockReturnValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockTokenService.generateTokens.mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // Act
      const result = await service.refreshTokens(userId, refreshToken);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(`refreshToken:${userId}`);
      expect(tokenService.validateRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        `refreshToken:${userId}`,
        'new-refresh-token',
        'EX',
        604800,
      );
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException if token not in redis', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token mismatch', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue('other-token');

      // Act & Assert
      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token invalid signature', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(refreshToken);
      mockTokenService.validateRefreshToken.mockReturnValue(false);

      // Act & Assert
      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
