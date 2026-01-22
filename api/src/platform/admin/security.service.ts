/**
 * =====================================================================
 * SECURITY SERVICE - QUẢN LÝ BẢO MẬT HỆ THỐNG
 * =====================================================================
 *
 * =====================================================================
 */

import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { EncryptionService } from '@core/security/encryption.service';
import { AuditService } from '@/audit/audit.service';

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
  ) {}

  async getSecurityStats() {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const [authAttempts, totalUsers, mfaUsers] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { twoFactorEnabled: true },
      }),
    ]);

    const mfaPercentage = totalUsers > 0 ? (mfaUsers / totalUsers) * 100 : 0;

    return {
      authAttempts,
      mfaPercentage: Math.round(mfaPercentage),
      blockedIps: 0, // No IP blocking logic implemented yet
      ddosStatus: 'Idle',
      threatGrade: 'A+',
    };
  }

  async setSystemLockdown(
    isEnabled: boolean,
    tenantId: string,
    userId?: string,
  ) {
    const result = await this.prisma.featureFlag.upsert({
      where: { key: 'SYSTEM_LOCKDOWN' },
      update: { isEnabled, tenantId },
      create: {
        key: 'SYSTEM_LOCKDOWN',
        isEnabled,
        description: 'Blocks all non-admin access to the platform',
        tenantId,
      },
    });

    // Audit Log for Lockdown Toggle
    await this.auditService.create({
      userId: userId,
      action: 'UPDATE_SYSTEM_LOCKDOWN',
      resource: 'Security',
      payload: { isEnabled },
    });

    return result;
  }

  async getLockdownStatus() {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: 'SYSTEM_LOCKDOWN' },
    });
    return !!flag?.isEnabled;
  }

  async getWhitelistedIps(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { whitelistedIps: true },
    });

    if (!user || !user.whitelistedIps) return [];

    // If it's a string, it might be encrypted
    if (
      typeof user.whitelistedIps === 'string' &&
      user.whitelistedIps.includes(':')
    ) {
      return this.encryptionService.decryptObject<string[]>(
        user.whitelistedIps,
      );
    }

    if (Array.isArray(user.whitelistedIps)) {
      return user.whitelistedIps as string[];
    }

    return [];
  }

  async updateWhitelistedIps(userId: string, ips: string[]) {
    // Encrypt before saving
    const encryptedIps = this.encryptionService.encryptObject(ips);

    return this.prisma.user.update({
      where: { id: userId },
      data: { whitelistedIps: encryptedIps },
    });
  }
}
