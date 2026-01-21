import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

/**
 * =====================================================================
 * USER ENTITY - Đối tượng người dùng (Lớp trình diễn dữ liệu)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA SERIALIZATION (Tuần tự hóa dữ liệu):
 * - DTO này đóng gói dữ liệu trả về cho Client.
 * - Không chứa password hay các field nhạy cảm.
 * - Các field roles/permissions được làm phẳng (Flatten) để dễ sử dụng.
 *
 * 2. NO CLASS-TRANSFORMER:
 * - Chúng ta gán dữ liệu thủ công trong constructor để đảm bảo an toàn và minh bạch.
 * - Không phụ thuộc vào decorator ma thuật.
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.
 *
 * =====================================================================
 */

export class UserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string | null;

  @ApiProperty()
  lastName: string | null;

  @ApiProperty()
  avatarUrl: string | null;

  @ApiProperty()
  twoFactorEnabled: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [String] })
  roles: string[];

  @ApiProperty({ type: [String] })
  permissions: string[];

  constructor(partial: Partial<User> & { roles?: any[]; permissions?: any[] }) {
    this.id = partial.id || '';
    this.email = partial.email || '';
    this.firstName = partial.firstName || null;
    this.lastName = partial.lastName || null;
    this.avatarUrl = partial.avatarUrl || null;
    this.twoFactorEnabled = partial.twoFactorEnabled ?? false;
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();

    // Map Roles
    this.roles = this.mapRoles(partial.roles);
    this.permissions = this.mapPermissions(partial.permissions, partial.roles);
  }

  private mapRoles(roles: any[] = []): string[] {
    if (!Array.isArray(roles)) return [];
    return roles
      .map((r) => {
        const roleName = r.role?.name || r.name || r;
        return typeof roleName === 'string' ? roleName : null;
      })
      .filter((r): r is string => Boolean(r));
  }

  private mapPermissions(permissions: any[] = [], roles: any[] = []): string[] {
    const directPerms = Array.isArray(permissions)
      ? permissions
          .map((p: any) => p.permission?.name || p.name || p)
          .filter((p) => typeof p === 'string')
      : [];

    let rolePerms: string[] = [];
    if (Array.isArray(roles)) {
      rolePerms = roles
        .flatMap(
          (ur: any) =>
            ur.role?.permissions?.map((rp: any) => rp.permission?.name) || [],
        )
        .filter(Boolean);
    }

    return [...new Set([...directPerms, ...rolePerms])];
  }
}
