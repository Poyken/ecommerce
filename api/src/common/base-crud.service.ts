import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export interface CrudDelegate<T> {
  findMany(args?: any): Promise<T[]>;
  findUnique(args?: any): Promise<T | null>;
  findFirst(args?: any): Promise<T | null>;
  create(args?: any): Promise<T>;
  update(args?: any): Promise<T>;
  delete(args?: any): Promise<T>;
  count(args?: any): Promise<number>;
}

/**
 * =====================================================================
 * BASE CRUD SERVICE - LỚP CƠ SỞ CHO CÁC DỊCH VỤ CRUD
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CHIẾN THUẬT REUSE (Tái sử dụng):
 * - Hầu hết các service (Product, Order, User...) đều có các thao tác cơ bản: Tìm tất cả, Tìm theo ID, Xóa soft-delete.
 * - `BaseCrudService` gom các logic này lại một chỗ để tránh lặp code (DRY - Don't Repeat Yourself).
 *
 * 2. DYNAMIC FIELDS (Truy vấn động):
 * - Hàm `parseFields` cho phép frontend yêu cầu chỉ lấy những trường dữ liệu cần thiết (VD: `select=id,name`).
 * - Giảm tải cho database và băng thông mạng (Network Payload).
 *
 * 3. STANDARDIZED PAGINATION:
 * - Tự động tính toán `skip`, `take` và trả về metadata (total, lastPage) theo một format nhất định cho mọi API.
 * =====================================================================
 */
@Injectable()
export abstract class BaseCrudService<T, CreateDto, UpdateDto> {
  protected abstract get model(): CrudDelegate<T>;
  protected readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  async findAllBase(
    page = 1,
    limit = 10,
    where: any = {},
    include: any = {},
    orderBy: any = { createdAt: 'desc' },
    select: any = null,
  ): Promise<PaginationResult<T>> {
    const skip = (page - 1) * limit;

    try {
      // [P13 OPTIMIZATION] Support both comma-separated string or Prisma select object
      const prismaSelect =
        typeof select === 'string' ? this.parseFields(select) : select;

      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include:
            prismaSelect || Object.keys(include).length === 0
              ? undefined
              : include,
          select: prismaSelect || undefined,
        }),
        this.model.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          lastPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to findAll: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not fetch records');
    }
  }

  /**
   * Generic FindOne
   * Supports both 'select' and 'include' via options object
   */
  async findOneBase(
    id: string,
    options?: { select?: any; include?: any },
  ): Promise<T> {
    const queryOptions: any = { where: { id } };

    if (options?.select) {
      queryOptions.select = options.select;
    } else if (options?.include) {
      queryOptions.include = options.include;
    }

    const item = await this.model.findUnique(queryOptions);

    if (!item) {
      throw new NotFoundException(`Record with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Generic Soft Delete
   * Requires model to have 'deletedAt' field
   */
  async softDeleteBase(id: string): Promise<T> {
    await this.findOneBase(id); // Check existence

    try {
      return await this.model.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Failed to soft delete: ${error.message}`);
      throw new InternalServerErrorException('Could not delete record');
    }
  }

  /**
   * Parse comma-separated fields into Prisma select object
   * Example: "id,name,category.id" -> { id: true, name: true, category: { select: { id: true } } }
   */
  private parseFields(fields: string): any {
    const result = {};
    const fieldArray = fields.split(',').map((f) => f.trim());

    for (const field of fieldArray) {
      const parts = field.split('.');
      let current = result;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = true;
        } else {
          if (!current[part]) {
            current[part] = { select: {} };
          }
          current = current[part].select;
        }
      }
    }

    return result;
  }

  /**
   * Generic Check Exists (Helper)
   */
  protected async checkExists(where: any): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}
