import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './two-factor.service';
import { PrismaService } from '@core/prisma/prisma.service';

// Mock otplib
jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('MOCK_SECRET'),
    keyuri: jest.fn().mockReturnValue('otpauth://totp/test'),
    verify: jest.fn(),
  },
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,QR_CODE'),
}));

import { authenticator } from 'otplib';

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  const mockPrismaService = {
    user: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate secret and otpauth URL', () => {
      const result = service.generateSecret('user@test.com');

      expect(result.secret).toBe('MOCK_SECRET');
      expect(result.otpauthUrl).toBe('otpauth://totp/test');
    });
  });

  describe('generateQrCodeDataURL', () => {
    it('should generate QR code data URL', async () => {
      const result = await service.generateQrCodeDataURL('otpauth://test');

      expect(result).toContain('data:image/png;base64');
    });
  });

  describe('verifyToken', () => {
    it('should return true for valid token', () => {
      (authenticator.verify as jest.Mock).mockReturnValue(true);

      const result = service.verifyToken('123456', 'SECRET');
      expect(result).toBe(true);
    });

    it('should return false for invalid token', () => {
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      const result = service.verifyToken('000000', 'SECRET');
      expect(result).toBe(false);
    });
  });

  describe('enableTwoFactor', () => {
    it('should enable 2FA for user', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        twoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      });

      const result = await service.enableTwoFactor('u1', 'SECRET');

      expect(result.twoFactorEnabled).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { twoFactorSecret: 'SECRET', twoFactorEnabled: true },
      });
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable 2FA for user', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u1',
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });

      const result = await service.disableTwoFactor('u1');

      expect(result.twoFactorEnabled).toBe(false);
      expect(result.twoFactorSecret).toBeNull();
    });
  });
});
