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
 * =====================================================================
 */
@Injectable()
export abstract class BaseCrudService<T, _CreateDto, _UpdateDto> {
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
      // [P13 OPTIMIZATION] Hỗ trợ cả chuỗi phân cách dấu phẩy hoặc Prisma select object
      // Ví dụ: "id,name" hoặc { id: true, name: true }
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to findAll: ${message}`, stack);
      throw new InternalServerErrorException('Could not fetch records');
    }
  }

  /**
   * Hàm tìm kiếm một bản ghi (FindOne Base).
   * Hỗ trợ tùy chọn `select` hoặc `include` thông qua options object.
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

    const item = await this.model.findFirst(queryOptions);

    if (!item) {
      throw new NotFoundException(`Record with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Hàm xóa mềm (Soft Delete Base).
   * Yêu cầu model phải có trường `deletedAt`.
   */
  async softDeleteBase(id: string): Promise<T> {
    await this.findOneBase(id); // Check existence

    try {
      return await this.model.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to soft delete: ${message}`);
      throw new InternalServerErrorException('Could not delete record');
    }
  }

  /**
   * Phân tích chuỗi các trường ngăn cách bởi dấu phẩy thành Prisma select object.
   * Ví dụ: "id,name,category.id" -> { id: true, name: true, category: { select: { id: true } } }
   * Giúp Client có thể request chính xác những field cần lấy (Graph-like fetching).
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
}
