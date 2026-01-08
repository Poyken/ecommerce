import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TokenService', () => {
  let service: TokenService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRED: '15m',
        JWT_REFRESH_EXPIRED: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const result = service.generateTokens('u1', ['read'], ['USER']);

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should include permissions and roles in payload', () => {
      service.generateTokens('u1', ['products:read', 'cart:write'], ['ADMIN']);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          permissions: ['products:read', 'cart:write'],
          roles: ['ADMIN'],
        }),
        expect.any(Object),
      );
    });

    it('should include fingerprint in payload', () => {
      service.generateTokens('u1', [], [], 'fp-hash-123');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ fp: 'fp-hash-123' }),
        expect.any(Object),
      );
    });
  });

  describe('getRefreshTokenExpirationTime', () => {
    it('should parse days duration', () => {
      const seconds = service.getRefreshTokenExpirationTime();
      expect(seconds).toBe(7 * 86400); // 7 days in seconds
    });
  });

  describe('validateRefreshToken', () => {
    it('should return payload for valid token', () => {
      mockJwtService.verify.mockReturnValue({ userId: 'u1' });

      const result = service.validateRefreshToken('valid-token');
      expect(result.userId).toBe('u1');
    });

    it('should return null for invalid token', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      const result = service.validateRefreshToken('invalid');
      expect(result).toBeNull();
    });
  });
});
