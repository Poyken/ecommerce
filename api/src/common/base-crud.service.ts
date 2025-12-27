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

@Injectable()
export abstract class BaseCrudService<T, CreateDto, UpdateDto> {
  protected abstract get model(): CrudDelegate<T>;
  protected readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  /**
   * Generic FindAll with Pagination
   */
  async findAllBase(
    page = 1,
    limit = 10,
    where: any = {},
    include: any = {},
    orderBy: any = { createdAt: 'desc' },
  ): Promise<PaginationResult<T>> {
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: Object.keys(include).length > 0 ? include : undefined,
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
   */
  async findOneBase(id: string, include: any = {}): Promise<T> {
    const item = await this.model.findUnique({
      where: { id },
      include: Object.keys(include).length > 0 ? include : undefined,
    });

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
   * Generic Check Exists (Helper)
   */
  protected async checkExists(where: any): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}
