import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { Logger, NotFoundException } from '@nestjs/common';

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
   * @returns Entity hoặc null
   */
  async findById(
    id: string,
    options?: Pick<FindOptions, 'select' | 'include'>,
  ): Promise<T | null> {
    return await this.model.findFirst({
      where: this.withTenantFilter({ id }),
      ...options,
    });
  }

  /**
   * Tìm một entity theo ID, throw NotFoundException nếu không tìm thấy.
   *
   * @param id - ID của entity
   * @param options - Select/include options
   * @returns Entity
   * @throws NotFoundException
   */
  async findByIdOrThrow(
    id: string,
    options?: Pick<FindOptions, 'select' | 'include'>,
  ): Promise<T> {
    const entity = await this.findById(id, options);
    if (!entity) {
      throw new NotFoundException(`${this.modelName} with ID ${id} not found`);
    }
    return entity;
  }

  /**
   * Tìm một entity theo điều kiện.
   *
   * @param options - Find options
   * @returns Entity hoặc null
   */
  async findFirst(options?: FindOptions): Promise<T | null> {
    return await this.model.findFirst({
      ...options,
      where: this.withTenantFilter(options?.where),
    });
  }

  /**
   * Tìm nhiều entities.
   *
   * @param options - Find options
   * @returns Array of entities
   */
  async findMany(options?: FindOptions): Promise<T[]> {
    return await this.model.findMany({
      ...options,
      where: this.withTenantFilter(options?.where),
    });
  }

  /**
   * Tìm nhiều entities với pagination.
   *
   * @param options - Find options
   * @param pagination - Pagination options
   * @returns Paginated result
   */
  async findManyPaginated(
    options?: FindOptions,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 10, 100); // Max 100 items
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        ...options,
        where: this.withTenantFilter(options?.where),
        skip,
        take: limit,
      }),
      this.model.count({
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
   * @returns Số lượng entities
   */
  async count(where?: Record<string, any>): Promise<number> {
    return await this.model.count({
      where: this.withTenantFilter(where),
    });
  }

  /**
   * Kiểm tra entity có tồn tại không.
   *
   * @param where - Điều kiện filter
   * @returns true nếu tồn tại
   */
  async exists(where: Record<string, any>): Promise<boolean> {
    const count = await this.count(where);
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
   * @returns Entity đã tạo
   */
  async create(
    data: Record<string, any>,
    options?: Pick<FindOptions, 'select' | 'include'>,
  ): Promise<T> {
    const tenantId = this.tenantId;
    return await this.model.create({
      data: tenantId ? { ...data, tenantId } : data,
      ...options,
    });
  }

  /**
   * Tạo nhiều entities.
   * Tự động thêm tenantId vào mỗi item.
   *
   * @param data - Array of data
   * @returns Số lượng entities đã tạo
   */
  async createMany(data: Record<string, any>[]): Promise<{ count: number }> {
    const tenantId = this.tenantId;
    const enrichedData = tenantId
      ? data.map((item) => ({ ...item, tenantId }))
      : data;

    return await this.model.createMany({ data: enrichedData });
  }

  /**
   * Cập nhật một entity theo ID.
   *
   * @param id - ID của entity
   * @param data - Data cần update
   * @param options - Select/include options
   * @returns Entity đã update
   */
  async update(
    id: string,
    data: Record<string, any>,
    options?: Pick<FindOptions, 'select' | 'include'>,
  ): Promise<T> {
    // Verify entity exists and belongs to tenant
    await this.findByIdOrThrow(id);

    return this.model.update({
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
   * @returns Số lượng entities đã update
   */
  async updateMany(
    where: Record<string, any>,
    data: Record<string, any>,
  ): Promise<{ count: number }> {
    return await this.model.updateMany({
      where: this.withTenantFilter(where),
      data,
    });
  }

  /**
   * Xóa một entity (soft delete nếu model có deletedAt).
   *
   * @param id - ID của entity
   * @returns Entity đã xóa
   */
  async delete(id: string): Promise<T> {
    // Verify entity exists and belongs to tenant
    await this.findByIdOrThrow(id);

    // Extension sẽ tự động convert delete thành soft delete nếu model có deletedAt
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Xóa nhiều entities.
   *
   * @param where - Điều kiện filter
   * @returns Số lượng entities đã xóa
   */
  async deleteMany(where: Record<string, any>): Promise<{ count: number }> {
    return await this.model.deleteMany({
      where: this.withTenantFilter(where),
    });
  }

  /**
   * Upsert (Update or Insert) một entity.
   *
   * @param where - Điều kiện unique để tìm
   * @param create - Data nếu tạo mới
   * @param update - Data nếu update
   * @returns Entity
   */
  async upsert(
    where: Record<string, any>,
    create: Record<string, any>,
    update: Record<string, any>,
  ): Promise<T> {
    const tenantId = this.tenantId;
    return await this.model.upsert({
      where: this.withTenantFilter(where),
      create: tenantId ? { ...create, tenantId } : create,
      update,
    });
  }
}
