import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

/**
 * =====================================================================
 * USER ENTITY - Đối tượng người dùng (Lớp trình diễn dữ liệu)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA SERIALIZATION (Tuần tự hóa dữ liệu):
 * - Khi trả về dữ liệu cho Client, ta không muốn lộ các thông tin nhạy cảm.
 * - `@Exclude()`: Đánh dấu các trường cần ẩn đi (VD: `password`).
 * - `@Expose()`: Đánh dấu các trường cần hiển thị, hoặc tạo ra các trường ảo (Virtual Fields).
 *
 * 2. VIRTUAL FIELDS (Trường ảo):
 * - `flattenedRoles` và `flattenedPermissions`: Đây không phải là các cột trong Database.
 * - Chúng được tính toán (Flatten) từ các quan hệ phức tạp của Prisma để trả về một mảng chuỗi đơn giản cho Frontend dễ xử lý.
 *
 * 3. CLASS TRANSFORMER:
 * - NestJS sử dụng thư viện `class-transformer` để tự động thực hiện việc chuyển đổi này dựa trên các Decorator ta đã khai báo.
 * =====================================================================
 */

export class UserEntity implements Partial<User> {
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

  @Exclude()
  password: string | null;

  @ApiProperty()
  twoFactorEnabled: boolean;

  @Exclude()
  twoFactorSecret: string | null;

  // 1. Ẩn dữ liệu thô từ Prisma
  @Exclude()
  roles: any[];

  @Exclude()
  permissions: any[];

  @Exclude()
  addresses: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
    // Explicitly map relations if needed, but for simplicity:
    if (partial.roles) {
      this.roles = partial.roles.map((r) => r.role?.name || r);
    }
    // The original constructor had explicit assignments for roles and permissions
    // which are now handled by the `if (partial.roles)` block and the new type definition.
    // No need for `this.permissions = partial?.permissions;` here as it's handled by Object.assign
    // and the getter will process the raw data if it's still an array of objects.
  }

  // 2. Tính toán Roles cho đầu ra JSON
  @ApiProperty({ type: [String] })
  @Expose({ name: 'roles' })
  get flattenedRoles(): string[] {
    if (!this.roles || !Array.isArray(this.roles)) return [];

    return this.roles
      .map((r: any) => {
        // Xử lý đối tượng UserRole hoặc chuỗi trực tiếp
        // r.role.name kiểm tra quan hệ lồng nhau
        // r.name kiểm tra đối tượng role trực tiếp (ít có khả năng ở đây nhưng là dự phòng tốt)
        // r là chuỗi
        const roleName = r.role?.name || r.name || r;
        return typeof roleName === 'string' ? roleName : null;
      })
      .filter((r): r is string => Boolean(r));
  }

  // 3. Tính toán Permissions cho đầu ra JSON
  @ApiProperty({ type: [String] })
  @Expose({ name: 'permissions' })
  get flattenedPermissions(): string[] {
    // A. Quyền trực tiếp
    const directPerms =
      this.permissions && Array.isArray(this.permissions)
        ? this.permissions
            .map((p: any) => p.permission?.name || p.name || p)
            .filter((p) => typeof p === 'string')
        : [];

    // B. Quyền từ Role
    let rolePerms: string[] = [];
    if (this.roles && Array.isArray(this.roles)) {
      rolePerms = this.roles
        .flatMap(
          (ur: any) =>
            ur.role?.permissions?.map((rp: any) => rp.permission?.name) || [],
        )
        .filter(Boolean);
    }

    // C. Kết hợp & Duy nhất
    return [...new Set([...directPerms, ...rolePerms])];
  }
}
