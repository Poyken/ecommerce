import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * =====================================================================
 * BASE REPOSITORY - LỚP CƠ SỞ CHO REPOSITORY PATTERN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REPOSITORY PATTERN LÀ GÌ?
 *    - Là một design pattern tách biệt logic truy cập dữ liệu (Data Access) ra khỏi Business Logic.
 *    - Service sẽ gọi Repository thay vì gọi trực tiếp Prisma.
 *    - Giúp code sạch hơn, dễ test hơn, dễ thay đổi database hơn.
 *
 * 2. LỢI ÍCH:
 *    - Single Responsibility: Repository chỉ lo query, Service chỉ lo business.
 *    - Dễ test: Mock repository thay vì mock Prisma phức tạp.
 *    - Reusable: Nhiều services có thể dùng chung repository.
 *    - Tenant-aware: Tự động thêm tenantId filter.
 *
 * 3. CÁCH SỬ DỤNG:
 *    ```typescript
 *    @Injectable()
 *    export class ProductsRepository extends BaseRepository<Product> {
 *      protected modelName = 'product' as const;
 *
 *      async findByBrand(brandId: string) {
 *        return this.findMany({ where: { brandId } });
 *      }
 *    }
 *    ```
 *
 * 🎯 ỨNG DỤNG THỰC TẾ:
 * - Giảm 40-60% code trong các service files.
 * - Query standardization: Tất cả queries đều có tenant filter.
 * - Performance monitoring: Dễ thêm logging/metrics cho queries.
 *
 * =====================================================================
 */

/**
 * Interface cho pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Options for find operations
 */
export interface FindOptions<TSelect = any, TInclude = any> {
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[];
  select?: TSelect;
  include?: TInclude;
  skip?: number;
  take?: number;
}

/**
 * Options for pagination
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Abstract base class for repositories with multi-tenancy support.
 *
 * @template T - The entity type this repository manages
 */
export abstract class BaseRepository<T = any> {
  protected readonly logger: Logger;

  /**
   * Tên model trong Prisma (lowercase).
   * Subclass PHẢI override property này.
   *
   * @example 'product', 'order', 'user'
   */
  protected abstract readonly modelName: string;

  constructor(protected readonly prisma: PrismaService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Lấy Prisma model delegate tương ứng.
   * Cho phép gọi các methods như findMany, create, update, etc.
   */
  protected get model() {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Helper để lấy model từ transaction context (nếu có) hoặc prisma service
   */
  protected getModel(tx?: Prisma.TransactionClient) {
    return ((tx || this.prisma) as any)[this.modelName];
  }

  /**
   * Lấy tenantId từ context (nếu có).
   * Trả về undefined nếu không có tenant context.
   */
  protected get tenantId(): string | undefined {
    return getTenant()?.id;
  }

  /**
   * Tự động thêm tenantId vào where condition.
   * Nếu không có tenant context, trả về where gốc.
   */
  protected withTenantFilter(where?: Record<string, any>): Record<string, any> {
    const tenantId = this.tenantId;
    if (!tenantId) {
      return where || {};
    }
    return {
      ...where,
      tenantId,
    };
  }

  // =====================================================================
  // READ OPERATIONS
  // =====================================================================

  /**
   * Tìm một entity theo ID.
   *
   * @param id - ID của entity
   * @param options - Select/include options
   * @param tx - Transaction client (optional)
   * @returns Entity hoặc null
   */
  async findById(
    id: string,
    options?: Pick<FindOptions, 'select' | 'include'>,
    tx?: Prisma.TransactionClient,
  ): Promise<T | null> {
    return await this.getModel(tx).findFirst({
      where: this.withTenantFilter({ id }),
      ...options,
    });
  }

  /**
   * Tìm một entity theo ID, throw NotFoundException nếu không tìm thấy.
   *
   * @param id - ID của entity
   * @param options - Select/include options
   * @param tx - Transaction client (optional)
   * @returns Entity
   * @throws NotFoundException
   */
  async findByIdOrThrow(
    id: string,
    options?: Pick<FindOptions, 'select' | 'include'>,
    tx?: Prisma.TransactionClient,
  ): Promise<T> {
    const entity = await this.findById(id, options, tx);
    if (!entity) {
      throw new NotFoundException(`${this.modelName} with ID ${id} not found`);
    }
    return entity;
  }

  /**
   * Tìm một entity theo điều kiện.
   *
   * @param options - Find options
   * @param tx - Transaction client (optional)
   * @returns Entity hoặc null
   */
  async findFirst(
    options?: FindOptions,
    tx?: Prisma.TransactionClient,
  ): Promise<T | null> {
    return await this.getModel(tx).findFirst({
      ...options,
      where: this.withTenantFilter(options?.where),
    });
  }

  /**
   * Tìm nhiều entities.
   *
   * @param options - Find options
   * @param tx - Transaction client (optional)
   * @returns Array of entities
   */
  async findMany(
    options?: FindOptions,
    tx?: Prisma.TransactionClient,
  ): Promise<T[]> {
    return await this.getModel(tx).findMany({
      ...options,
      where: this.withTenantFilter(options?.where),
    });
  }

  /**
   * Tìm nhiều entities với pagination.
   *
   * @param options - Find options
   * @param pagination - Pagination options
   * @param tx - Transaction client (optional)
   * @returns Paginated result
   */
  async findManyPaginated(
    options?: FindOptions,
    pagination?: PaginationOptions,
    tx?: Prisma.TransactionClient,
  ): Promise<PaginatedResult<T>> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 10, 100); // Max 100 items
    const skip = (page - 1) * limit;

    const model = this.getModel(tx);

    const [data, total] = await Promise.all([
      model.findMany({
        ...options,
        where: this.withTenantFilter(options?.where),
        skip,
        take: limit,
      }),
      model.count({
        where: this.withTenantFilter(options?.where),
      }),
    ]);

    const lastPage = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Đếm số lượng entities.
   *
   * @param where - Điều kiện filter
   * @param tx - Transaction client (optional)
   * @returns Số lượng entities
   */
  async count(
    where?: Record<string, any>,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return await this.getModel(tx).count({
      where: this.withTenantFilter(where),
    });
  }

  /**
   * Kiểm tra entity có tồn tại không.
   *
   * @param where - Điều kiện filter
   * @param tx - Transaction client (optional)
   * @returns true nếu tồn tại
   */
  async exists(
    where: Record<string, any>,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const count = await this.count(where, tx);
    return count > 0;
  }

  // =====================================================================
  // WRITE OPERATIONS
  // =====================================================================

  /**
   * Tạo một entity mới.
   * Tự động thêm tenantId vào data.
   *
   * @param data - Data để tạo
   * @param options - Select/include options
   * @param tx - Transaction client (optional)
   * @returns Entity đã tạo
   */
  async create(
    data: Record<string, any>,
    options?: Pick<FindOptions, 'select' | 'include'>,
    tx?: Prisma.TransactionClient,
  ): Promise<T> {
    const tenantId = this.tenantId;
    return await this.getModel(tx).create({
      data: tenantId ? { ...data, tenantId } : data,
      ...options,
    });
  }

  /**
   * Tạo nhiều entities.
   * Tự động thêm tenantId vào mỗi item.
   *
   * @param data - Array of data
   * @param tx - Transaction client (optional)
   * @returns Số lượng entities đã tạo
   */
  async createMany(
    data: Record<string, any>[],
    tx?: Prisma.TransactionClient,
  ): Promise<{ count: number }> {
    const tenantId = this.tenantId;
    const enrichedData = tenantId
      ? data.map((item) => ({ ...item, tenantId }))
      : data;

    return await this.getModel(tx).createMany({ data: enrichedData });
  }

  /**
   * Cập nhật một entity theo ID.
   *
   * @param id - ID của entity
   * @param data - Data cần update
   * @param options - Select/include options
   * @param tx - Transaction client (optional)
   * @returns Entity đã update
   */
  async update(
    id: string,
    data: Record<string, any>,
    options?: Pick<FindOptions, 'select' | 'include'>,
    tx?: Prisma.TransactionClient,
  ): Promise<T> {
    // Verify entity exists and belongs to tenant
    await this.findByIdOrThrow(id, undefined, tx);

    return this.getModel(tx).update({
      where: { id },
      data,
      ...options,
    });
  }

  /**
   * Cập nhật nhiều entities.
   *
   * @param where - Điều kiện filter
   * @param data - Data cần update
   * @param tx - Transaction client (optional)
   * @returns Số lượng entities đã update
   */
  async updateMany(
    where: Record<string, any>,
    data: Record<string, any>,
    tx?: Prisma.TransactionClient,
  ): Promise<{ count: number }> {
    return await this.getModel(tx).updateMany({
      where: this.withTenantFilter(where),
      data,
    });
  }

  /**
   * Xóa một entity (soft delete nếu model có deletedAt).
   *
   * @param id - ID của entity
   * @param tx - Transaction client (optional)
   * @returns Entity đã xóa
   */
  async delete(id: string, tx?: Prisma.TransactionClient): Promise<T> {
    // Verify entity exists and belongs to tenant
    await this.findByIdOrThrow(id, undefined, tx);

    // Extension sẽ tự động convert delete thành soft delete nếu model có deletedAt
    return this.getModel(tx).delete({
      where: { id },
    });
  }

  /**
   * Xóa nhiều entities.
   *
   * @param where - Điều kiện filter
   * @param tx - Transaction client (optional)
   * @returns Số lượng entities đã xóa
   */
  async deleteMany(
    where: Record<string, any>,
    tx?: Prisma.TransactionClient,
  ): Promise<{ count: number }> {
    return await this.getModel(tx).deleteMany({
      where: this.withTenantFilter(where),
    });
  }

  /**
   * Upsert (Update or Insert) một entity.
   *
   * @param where - Điều kiện unique để tìm
   * @param create - Data nếu tạo mới
   * @param update - Data nếu update
   * @param tx - Transaction client (optional)
   * @returns Entity
   */
  async upsert(
    where: Record<string, any>,
    create: Record<string, any>,
    update: Record<string, any>,
    tx?: Prisma.TransactionClient,
  ): Promise<T> {
    const tenantId = this.tenantId;
    return await this.getModel(tx).upsert({
      where: this.withTenantFilter(where),
      create: tenantId ? { ...create, tenantId } : create,
      update,
    });
  }
}
