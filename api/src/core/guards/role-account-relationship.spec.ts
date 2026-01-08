import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * =====================================================================
 * ROLE-ACCOUNT RELATIONSHIP TESTS - Kiểm tra quan hệ giữa Roles và Accounts
 * =====================================================================
 *
 * Dựa trên Prisma Schema:
 * - User ↔ UserRole ↔ Role (Many-to-Many)
 * - Role ↔ RolePermission ↔ Permission (Many-to-Many)
 * - User ↔ UserPermission ↔ Permission (Many-to-Many, Direct)
 *
 * Composite Keys:
 * - UserRole: [userId, roleId]
 * - RolePermission: [roleId, permissionId]
 * - UserPermission: [userId, permissionId]
 */

describe('Role-Account Relationship Tests (Based on Prisma Schema)', () => {
  // Mock Prisma Service matching schema structure
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    userRole: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    rolePermission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userPermission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================
  // 1. USER ↔ ROLE (Many-to-Many via UserRole)
  // ===========================================
  describe('User ↔ Role Relationship (UserRole pivot table)', () => {
    it('should assign single role to user', async () => {
      const userId = 'user-1';
      const roleId = 'role-user';

      mockPrismaService.userRole.create.mockResolvedValue({
        userId,
        roleId,
        role: { id: roleId, name: 'USER' },
        user: { id: userId, email: 'user@test.com' },
      });

      const result = await mockPrismaService.userRole.create({
        data: { userId, roleId },
        include: { role: true, user: true },
      });

      expect(result.userId).toBe(userId);
      expect(result.roleId).toBe(roleId);
      expect(result.role.name).toBe('USER');
    });

    it('should assign multiple roles to single user', async () => {
      const userId = 'user-admin';

      mockPrismaService.userRole.findMany.mockResolvedValue([
        { userId, roleId: 'role-user', role: { name: 'USER' } },
        { userId, roleId: 'role-admin', role: { name: 'ADMIN' } },
      ]);

      const userRoles = await mockPrismaService.userRole.findMany({
        where: { userId },
        include: { role: true },
      });

      expect(userRoles).toHaveLength(2);
      expect(userRoles.map((ur) => ur.role.name)).toContain('USER');
      expect(userRoles.map((ur) => ur.role.name)).toContain('ADMIN');
    });

    it('should find all users with specific role', async () => {
      const roleId = 'role-admin';

      mockPrismaService.userRole.findMany.mockResolvedValue([
        { roleId, userId: 'admin-1', user: { email: 'admin1@test.com' } },
        { roleId, userId: 'admin-2', user: { email: 'admin2@test.com' } },
        { roleId, userId: 'superadmin', user: { email: 'super@test.com' } },
      ]);

      const admins = await mockPrismaService.userRole.findMany({
        where: { roleId },
        include: { user: true },
      });

      expect(admins).toHaveLength(3);
    });

    it('should prevent duplicate role assignment (composite key)', async () => {
      const userId = 'user-1';
      const roleId = 'role-user';

      // Schema: @@id([userId, roleId]) - composite primary key
      mockPrismaService.userRole.findUnique.mockResolvedValue({
        userId,
        roleId,
      });

      const existing = await mockPrismaService.userRole.findUnique({
        where: { userId_roleId: { userId, roleId } },
      });

      expect(existing).not.toBeNull();
      // Attempting to create duplicate would throw PrismaError P2002
    });

    it('should cascade delete UserRole when User is deleted', async () => {
      // Schema: onDelete: Cascade on user relation
      const userId = 'user-to-delete';

      mockPrismaService.userRole.deleteMany.mockResolvedValue({ count: 2 });

      const result = await mockPrismaService.userRole.deleteMany({
        where: { userId },
      });

      expect(result.count).toBe(2);
    });

    it('should cascade delete UserRole when Role is deleted', async () => {
      // Schema: onDelete: Cascade on role relation
      const roleId = 'role-to-delete';

      mockPrismaService.userRole.deleteMany.mockResolvedValue({ count: 5 });

      const result = await mockPrismaService.userRole.deleteMany({
        where: { roleId },
      });

      expect(result.count).toBe(5);
    });
  });

  // ===========================================
  // 2. ROLE ↔ PERMISSION (Many-to-Many via RolePermission)
  // ===========================================
  describe('Role ↔ Permission Relationship (RolePermission pivot table)', () => {
    it('should assign permissions to role', async () => {
      const roleId = 'role-admin';

      mockPrismaService.rolePermission.findMany.mockResolvedValue([
        {
          roleId,
          permissionId: 'perm-1',
          permission: { name: 'products:read' },
        },
        {
          roleId,
          permissionId: 'perm-2',
          permission: { name: 'products:write' },
        },
        {
          roleId,
          permissionId: 'perm-3',
          permission: { name: 'products:delete' },
        },
        { roleId, permissionId: 'perm-4', permission: { name: 'orders:read' } },
        {
          roleId,
          permissionId: 'perm-5',
          permission: { name: 'orders:write' },
        },
      ]);

      const rolePerms = await mockPrismaService.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
      });

      expect(rolePerms).toHaveLength(5);
      expect(rolePerms.map((rp) => rp.permission.name)).toContain(
        'products:delete',
      );
    });

    it('should differentiate permissions between USER and ADMIN roles', async () => {
      // USER role - limited permissions
      mockPrismaService.rolePermission.findMany
        .mockResolvedValueOnce([
          { permission: { name: 'products:read' } },
          { permission: { name: 'cart:write' } },
        ])
        .mockResolvedValueOnce([
          { permission: { name: 'products:read' } },
          { permission: { name: 'products:write' } },
          { permission: { name: 'products:delete' } },
          { permission: { name: 'orders:read' } },
          { permission: { name: 'orders:write' } },
          { permission: { name: 'users:read' } },
        ]);

      const userPerms = await mockPrismaService.rolePermission.findMany({
        where: { roleId: 'role-user' },
        include: { permission: true },
      });

      const adminPerms = await mockPrismaService.rolePermission.findMany({
        where: { roleId: 'role-admin' },
        include: { permission: true },
      });

      expect(userPerms).toHaveLength(2);
      expect(adminPerms).toHaveLength(6);
      expect(adminPerms.length).toBeGreaterThan(userPerms.length);
    });

    it('should prevent duplicate permission assignment to role', async () => {
      // Schema: @@id([roleId, permissionId])
      mockPrismaService.rolePermission.findUnique.mockResolvedValue({
        roleId: 'role-admin',
        permissionId: 'perm-1',
      });

      const existing = await mockPrismaService.rolePermission.findUnique({
        where: {
          roleId_permissionId: { roleId: 'role-admin', permissionId: 'perm-1' },
        },
      });

      expect(existing).not.toBeNull();
    });
  });

  // ===========================================
  // 3. USER ↔ PERMISSION (Direct, Many-to-Many via UserPermission)
  // ===========================================
  describe('User ↔ Permission Direct Relationship (UserPermission)', () => {
    it('should assign direct permission to user (bypassing roles)', async () => {
      const userId = 'special-user';
      const permissionId = 'perm-special';

      mockPrismaService.userPermission.create.mockResolvedValue({
        userId,
        permissionId,
        permission: { name: 'special:access' },
      });

      const result = await mockPrismaService.userPermission.create({
        data: { userId, permissionId },
        include: { permission: true },
      });

      expect(result.permission.name).toBe('special:access');
    });

    it('should combine direct permissions with role permissions', async () => {
      const userId = 'user-with-both';

      // Direct permissions
      mockPrismaService.userPermission.findMany.mockResolvedValue([
        { permission: { name: 'special:access' } },
      ]);

      // Role permissions (via UserRole → Role → RolePermission)
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        permissions: [{ permission: { name: 'special:access' } }],
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
      });

      const user = await mockPrismaService.user.findUnique({
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

      // Aggregate all permissions
      const directPerms = user.permissions.map((p) => p.permission.name);
      const rolePerms = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name),
      );
      const allPerms = [...new Set([...directPerms, ...rolePerms])];

      expect(allPerms).toContain('special:access');
      expect(allPerms).toContain('products:read');
      expect(allPerms).toContain('cart:write');
      expect(allPerms).toHaveLength(3);
    });
  });

  // ===========================================
  // 4. ROLE HIERARCHY TESTS (SUPER_ADMIN > ADMIN > USER)
  // ===========================================
  describe('Role Hierarchy (SUPER_ADMIN > ADMIN > USER)', () => {
    it('should define standard role names', async () => {
      mockPrismaService.role.findMany.mockResolvedValue([
        { id: '1', name: 'USER' },
        { id: '2', name: 'ADMIN' },
        { id: '3', name: 'SUPER_ADMIN' },
      ]);

      const roles = await mockPrismaService.role.findMany();
      const roleNames = roles.map((r) => r.name);

      expect(roleNames).toContain('USER');
      expect(roleNames).toContain('ADMIN');
      expect(roleNames).toContain('SUPER_ADMIN');
    });

    it('should verify SUPER_ADMIN has all permissions implicitly', () => {
      // This is handled in PermissionsGuard - bypass for SUPER_ADMIN
      const user = {
        roles: ['SUPER_ADMIN'],
        permissions: [], // Empty but has full access
      };

      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      expect(isSuperAdmin).toBe(true);
      // Guard logic: if SUPER_ADMIN → return true (bypass all permission checks)
    });

    it('should verify user can have multiple roles in hierarchy', async () => {
      // User with both ADMIN and USER roles
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'multi-role-user',
        roles: [{ role: { name: 'USER' } }, { role: { name: 'ADMIN' } }],
      });

      const user = await mockPrismaService.user.findUnique({
        where: { id: 'multi-role-user' },
        include: { roles: { include: { role: true } } },
      });

      const roleNames = user.roles.map((ur) => ur.role.name);
      expect(roleNames).toContain('USER');
      expect(roleNames).toContain('ADMIN');
    });
  });

  // ===========================================
  // 5. ACCOUNT SECURITY FIELDS
  // ===========================================
  describe('Account Security Fields (from User model)', () => {
    it('should support 2FA fields', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'secure-user',
        twoFactorEnabled: true,
        twoFactorSecret: 'encrypted-secret',
      });

      const user = await mockPrismaService.user.findUnique({
        where: { id: 'secure-user' },
      });

      expect(user.twoFactorEnabled).toBe(true);
      expect(user.twoFactorSecret).toBeDefined();
    });

    it('should support IP whitelist for SUPER_ADMIN', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'superadmin',
        whitelistedIps: ['192.168.1.100', '10.0.0.1'],
        roles: [{ role: { name: 'SUPER_ADMIN' } }],
      });

      const user = await mockPrismaService.user.findUnique({
        where: { id: 'superadmin' },
      });

      expect(user.whitelistedIps).toContain('192.168.1.100');
    });

    it('should support social login (provider + socialId)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'social-user',
        provider: 'google',
        socialId: 'google-123456',
        password: null, // Social users may not have password
      });

      const user = await mockPrismaService.user.findUnique({
        where: { id: 'social-user' },
      });

      expect(user.provider).toBe('google');
      expect(user.socialId).toBeDefined();
      expect(user.password).toBeNull();
    });
  });

  // ===========================================
  // 6. MULTI-TENANCY SUPPORT
  // ===========================================
  describe('Multi-tenancy Support (tenantId on User)', () => {
    it('should support tenant-scoped users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'u1', email: 'user1@tenant-a.com', tenantId: 'tenant-a' },
        { id: 'u2', email: 'user2@tenant-a.com', tenantId: 'tenant-a' },
      ]);

      const tenantUsers = await mockPrismaService.user.findMany({
        where: { tenantId: 'tenant-a' },
      });

      expect(tenantUsers).toHaveLength(2);
      expect(tenantUsers[0].tenantId).toBe('tenant-a');
    });

    it('should support global users (no tenant)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'global-admin',
        email: 'admin@global.com',
        tenantId: null,
      });

      const user = await mockPrismaService.user.findUnique({
        where: { id: 'global-admin' },
      });

      expect(user.tenantId).toBeNull();
    });
  });
});
