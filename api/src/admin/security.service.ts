/**
 * =====================================================================
 * SECURITY SERVICE - QUẢN LÝ BẢO MẬT HỆ THỐNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Service này quản lý các tính năng bảo mật cấp cao cho Super Admin:
 *
 * 1. SECURITY STATS (getSecurityStats):
 *    - Thống kê số lần đăng nhập trong 24h qua (từ AuditLog)
 *    - Tính % người dùng đã bật 2FA (Two-Factor Authentication)
 *    - Hiển thị trên Security Dashboard của Super Admin
 *
 * 2. SYSTEM LOCKDOWN (setSystemLockdown/getLockdownStatus):
 *    - Tính năng "khóa hệ thống" khẩn cấp
 *    - Khi bật: Chỉ Super Admin được truy cập, tất cả user khác bị chặn
 *    - Dùng FeatureFlag 'SYSTEM_LOCKDOWN' để lưu trạng thái
 *    - Ứng dụng: Khi bị tấn công, bảo trì khẩn cấp, hoặc phát hiện rò rỉ dữ liệu
 *
 * 3. IP WHITELIST (getWhitelistedIps/updateWhitelistedIps):
 *    - Cho phép Super Admin chỉ định danh sách IP được phép đăng nhập
 *    - Dữ liệu được MÃ HÓA (encrypted) trước khi lưu vào DB để bảo mật
 *    - EncryptionService xử lý encrypt/decrypt dữ liệu nhạy cảm
 *
 * 4. LƯU Ý BẢO MẬT:
 *    - Tất cả endpoint được bảo vệ bởi @Permissions('superAdmin:read/write')
 *    - IP whitelist được encrypt để tránh lộ thông tin nếu DB bị xâm nhập
 * =====================================================================
 */

import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { EncryptionService } from '@core/security/encryption.service';

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
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

  async setSystemLockdown(isEnabled: boolean, tenantId: string) {
    return this.prisma.featureFlag.upsert({
      where: { key: 'SYSTEM_LOCKDOWN' },
      update: { isEnabled, tenantId },
      create: {
        key: 'SYSTEM_LOCKDOWN',
        isEnabled,
        description: 'Blocks all non-admin access to the platform',
        tenantId,
      },
    });
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
