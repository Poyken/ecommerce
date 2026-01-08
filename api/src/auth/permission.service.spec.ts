import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService, UserWithPermissions } from './permission.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';

describe('PermissionService - Admin and User Role Integration', () => {
  let service: PermissionService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('aggregatePermissions', () => {
    it('should aggregate permissions for regular USER', () => {
      const user: UserWithPermissions = {
        id: 'u1',
        permissions: [], // Users typically have no direct permissions
        roles: [
          {
            role: {
              permissions: [
                { permission: { name: 'products:read' } },
                { permission: { name: 'cart:write' } },
              ],
            },
          },
        ],
      };

      const result = service.aggregatePermissions(user);
      expect(result).toContain('products:read');
      expect(result).toContain('cart:write');
      expect(result).toHaveLength(2);
    });

    it('should aggregate permissions for ADMIN role', () => {
      const user: UserWithPermissions = {
        id: 'admin1',
        permissions: [],
        roles: [
          {
            role: {
              permissions: [
                { permission: { name: 'products:read' } },
                { permission: { name: 'products:write' } },
                { permission: { name: 'products:delete' } },
                { permission: { name: 'orders:read' } },
                { permission: { name: 'orders:write' } },
                { permission: { name: 'users:read' } },
              ],
            },
          },
        ],
      };

      const result = service.aggregatePermissions(user);
      expect(result).toHaveLength(6);
      expect(result).toContain('products:delete');
      expect(result).toContain('users:read');
    });

    it('should merge direct permissions with role permissions', () => {
      const user: UserWithPermissions = {
        id: 'u2',
        permissions: [
          { permission: { name: 'special:access' } }, // Direct permission
        ],
        roles: [
          {
            role: {
              permissions: [{ permission: { name: 'products:read' } }],
            },
          },
        ],
      };

      const result = service.aggregatePermissions(user);
      expect(result).toContain('special:access');
      expect(result).toContain('products:read');
      expect(result).toHaveLength(2);
    });

    it('should remove duplicate permissions', () => {
      const user: UserWithPermissions = {
        id: 'u3',
        permissions: [
          { permission: { name: 'products:read' } }, // Also in role
        ],
        roles: [
          {
            role: {
              permissions: [{ permission: { name: 'products:read' } }],
            },
          },
        ],
      };

      const result = service.aggregatePermissions(user);
      expect(result).toEqual(['products:read']); // No duplicates
    });

    it('should aggregate permissions from multiple roles', () => {
      const user: UserWithPermissions = {
        id: 'u4',
        permissions: [],
        roles: [
          {
            role: {
              permissions: [{ permission: { name: 'products:read' } }],
            },
          },
          {
            role: {
              permissions: [
                { permission: { name: 'orders:read' } },
                { permission: { name: 'orders:write' } },
              ],
            },
          },
        ],
      };

      const result = service.aggregatePermissions(user);
      expect(result).toHaveLength(3);
      expect(result).toContain('products:read');
      expect(result).toContain('orders:read');
      expect(result).toContain('orders:write');
    });
  });

  describe('getUserPermissions', () => {
    it('should return cached permissions if available', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(['cached:perm']));

      const result = await service.getUserPermissions('u1');
      expect(result).toEqual(['cached:perm']);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache on cache miss', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        permissions: [],
        roles: [
          {
            role: {
              permissions: [{ permission: { name: 'db:perm' } }],
            },
          },
        ],
      });

      const result = await service.getUserPermissions('u1');
      expect(result).toEqual(['db:perm']);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return empty array for non-existent user', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserPermissions('unknown');
      expect(result).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify(['products:read', 'products:write']),
      );

      const result = await service.hasPermission('u1', 'products:read');
      expect(result).toBe(true);
    });

    it('should return false if user lacks permission', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(['products:read']));

      const result = await service.hasPermission('u1', 'admin:delete');
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has ALL permissions', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(['a', 'b', 'c']));

      const result = await service.hasAllPermissions('u1', ['a', 'b']);
      expect(result).toBe(true);
    });

    it('should return false if user missing any permission', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(['a', 'b']));

      const result = await service.hasAllPermissions('u1', ['a', 'b', 'c']);
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has ANY permission', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(['x']));

      const result = await service.hasAnyPermission('u1', ['x', 'y', 'z']);
      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(['a']));

      const result = await service.hasAnyPermission('u1', ['x', 'y']);
      expect(result).toBe(false);
    });
  });
});
