import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService } from './feature-flags.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheL1Service } from '../cache-l1.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  const mockPrismaService = {
    featureFlag: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockCacheL1 = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: CacheL1Service, useValue: mockCacheL1 },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnabled', () => {
    it('should return true for enabled flag', async () => {
      mockCacheL1.get.mockReturnValue(null);
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.featureFlag.findUnique.mockResolvedValue({
        key: 'NEW_FEATURE',
        isEnabled: true,
      });

      const result = await service.isEnabled('NEW_FEATURE');
      expect(result).toBe(true);
    });

    it('should return false for disabled flag', async () => {
      mockCacheL1.get.mockReturnValue({ key: 'DISABLED', isEnabled: false });

      const result = await service.isEnabled('DISABLED');
      expect(result).toBe(false);
    });

    it('should return false for non-existent flag', async () => {
      mockCacheL1.get.mockReturnValue(null);
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.featureFlag.findUnique.mockResolvedValue(null);

      const result = await service.isEnabled('UNKNOWN');
      expect(result).toBe(false);
    });

    it('should use L1 cache when available', async () => {
      mockCacheL1.get.mockReturnValue({ key: 'CACHED', isEnabled: true });

      const result = await service.isEnabled('CACHED');
      expect(result).toBe(true);
      expect(mockCacheManager.get).not.toHaveBeenCalled();
    });

    it('should handle environment targeting', async () => {
      mockCacheL1.get.mockReturnValue({
        key: 'ENV_FLAG',
        isEnabled: true,
        rules: { environments: ['staging'] },
      });

      const prodResult = await service.isEnabled('ENV_FLAG', {
        environment: 'production',
      });
      expect(prodResult).toBe(false);

      const stagingResult = await service.isEnabled('ENV_FLAG', {
        environment: 'staging',
      });
      expect(stagingResult).toBe(true);
    });
  });

  describe('create', () => {
    it('should create flag and invalidate cache', async () => {
      mockPrismaService.featureFlag.create.mockResolvedValue({
        key: 'NEW',
        isEnabled: true,
      });

      const result = await service.create({ key: 'NEW', isEnabled: true });

      expect(result.key).toBe('NEW');
      expect(mockCacheManager.del).toHaveBeenCalled();
      expect(mockCacheL1.delete).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update flag and invalidate cache', async () => {
      mockPrismaService.featureFlag.update.mockResolvedValue({
        key: 'FLAG',
        isEnabled: false,
      });

      const result = await service.update('FLAG', { isEnabled: false });

      expect(result.isEnabled).toBe(false);
      expect(mockCacheManager.del).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete flag and invalidate cache', async () => {
      mockPrismaService.featureFlag.delete.mockResolvedValue({});

      const result = await service.remove('FLAG');

      expect(result.success).toBe(true);
      expect(mockCacheManager.del).toHaveBeenCalled();
    });
  });
});
