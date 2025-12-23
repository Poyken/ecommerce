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
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  avatarUrl: string;

  @Exclude()
  password: string;

  // 1. Ẩn dữ liệu thô từ Prisma
  @Exclude()
  roles: any[];

  @Exclude()
  permissions: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<UserEntity> | any) {
    Object.assign(this, partial);
    // Gán mảng thô một cách rõ ràng để đảm bảo chúng có sẵn cho các getter
    // ngay cả khi Object.assign có thể xử lý chúng khác nhau tùy thuộc vào cấu hình TS
    this.roles = partial?.roles;
    this.permissions = partial?.permissions;
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
