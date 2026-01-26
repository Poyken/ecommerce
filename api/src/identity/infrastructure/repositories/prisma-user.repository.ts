/**
 * =====================================================================
 * PRISMA USER REPOSITORY - Infrastructure Layer (Adapter)
 * =====================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  IUserRepository,
  UserQueryOptions,
} from '../../domain/repositories/user.repository.interface';
import {
  User,
  UserProps,
  UserStatus,
  UserRole,
  UserProfile,
  UserPreferences,
} from '../../domain/entities/user.entity';
import {
  PaginatedResult,
  createPaginatedResult,
  calculateSkip,
} from '@core/application/pagination';
import { Email } from '@core/domain/value-objects/email.vo';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Common include for RBAC
  private get rbacInclude() {
    return {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      permissions: {
        include: {
          permission: true,
        },
      },
    };
  }

  async findById(id: string): Promise<User | null> {
    const data = await (this.prisma.user as any).findUnique({
      where: { id },
      include: this.rbacInclude,
    });
    return data ? this.toDomain(data) : null;
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found: ${id}`);
    }
    return user;
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const data = await (this.prisma.user as any).findFirst({
      where: { tenantId, email: email.toLowerCase() },
      include: this.rbacInclude,
    });
    return data ? this.toDomain(data) : null;
  }

  async findByEmailGlobal(email: string): Promise<User | null> {
    const data = await (this.prisma.user as any).findFirst({
      where: { email: email.toLowerCase() },
      include: this.rbacInclude,
    });
    return data ? this.toDomain(data) : null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma.user as any).count({ where: { id } });
    return count > 0;
  }

  async isEmailUnique(
    tenantId: string,
    email: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { tenantId, email: email.toLowerCase() };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await (this.prisma.user as any).count({ where });
    return count === 0;
  }

  async findAll(
    tenantId: string,
    options?: UserQueryOptions,
  ): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      emailVerified,
    } = options || {};
    const skip = calculateSkip(page, limit);

    const where: any = { tenantId, deletedAt: null };

    if (role) {
      where.role = Array.isArray(role) ? { in: role } : role;
    }

    if (status) {
      where.status = status;
    }

    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      (this.prisma.user as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma.user as any).count({ where }),
    ]);

    const users = data.map((d: any) => this.toDomain(d));
    return createPaginatedResult(users, total, page, limit);
  }

  async findStaff(tenantId: string): Promise<User[]> {
    const data = await (this.prisma.user as any).findMany({
      where: {
        tenantId,
        role: { in: [UserRole.ADMIN, UserRole.STAFF] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.toDomain(d));
  }

  async countByRole(tenantId: string): Promise<Record<UserRole, number>> {
    const counts = await (this.prisma.user as any).groupBy({
      by: ['role'],
      where: { tenantId, deletedAt: null },
      _count: { role: true },
    });

    const result: Record<UserRole, number> = {
      [UserRole.SUPER_ADMIN]: 0,
      [UserRole.ADMIN]: 0,
      [UserRole.STAFF]: 0,
      [UserRole.CUSTOMER]: 0,
    };

    counts.forEach((c: any) => {
      result[c.role as UserRole] = c._count.role;
    });

    return result;
  }

  async save(user: User): Promise<User> {
    const data = user.toPersistence();
    const tenant = getTenant();

    const existing = await (this.prisma.user as any).findUnique({
      where: { id: user.id },
    });

    let saved;
    if (existing) {
      saved = await (this.prisma.user as any).update({
        where: { id: user.id },
        data: {
          email: data.email,
          password: data.passwordHash,
          role: data.role,
          status: data.status,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          mfaEnabled: data.mfaEnabled,
          lastLoginAt: data.lastLoginAt,
          failedLoginAttempts: data.failedLoginAttempts,
          lockedUntil: data.lockedUntil,
          updatedAt: new Date(),
          deletedAt: data.deletedAt,
        },
      });
    } else {
      saved = await (this.prisma.user as any).create({
        data: {
          id: data.id,
          tenantId: tenant?.id || data.tenantId,
          email: data.email,
          password: data.passwordHash,
          role: data.role,
          status: data.status,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          mfaEnabled: false,
          failedLoginAttempts: 0,
        } as any,
      });
    }

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma.user as any).update({
      where: { id },
      data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
    });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const data = await (this.prisma.user as any).findMany({
      where: { id: { in: ids } },
    });

    return data.map((d: any) => this.toDomain(d));
  }

  async updateLastLogin(userId: string): Promise<void> {
    await (this.prisma.user as any).update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  // =====================================================================
  // MAPPER
  // =====================================================================

  private toDomain(data: any): User {
      console.log('DEBUG USER data:', { 
        id: data.id, 
        email: data.email, 
        passwordLength: data.password ? data.password.length : 0,
        passwordPreview: data.password ? data.password.substring(0, 15) + '...' : 'N/A'
      });
    const profile: UserProfile = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      dateOfBirth: data.dateOfBirth,
    };

    const preferences: UserPreferences = data.preferences || {
      language: 'vi',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    };

    const props: UserProps = {
      id: data.id,
      tenantId: data.tenantId,
      email: Email.create(data.email),
      passwordHash: data.password,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      profile,
      preferences,
      emailVerified: data.emailVerified || false,
      emailVerifiedAt: data.emailVerifiedAt,
      mfaEnabled: data.mfaEnabled || false,
      mfaSecret: data.mfaSecret,
      lastLoginAt: data.lastLoginAt,
      failedLoginAttempts: data.failedLoginAttempts || 0,
      lockedUntil: data.lockedUntil,
      permissions: (() => {
        const perms = new Set<string>();
        // 1. Direct Permissions
        if (data.permissions) {
            data.permissions.forEach((up: any) => {
                if (up.permission?.name) perms.add(up.permission.name);
            });
        }
        // 2. Role Permissions
        if (data.roles) {
          data.roles.forEach((ur: any) => {
            ur.role?.permissions?.forEach((rp: any) => {
              if (rp.permission?.name) perms.add(rp.permission.name);
            });
          });
        }
        return Array.from(perms);
      })(),
      deletedAt: data.deletedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return User.fromPersistence(props);
  }
}
