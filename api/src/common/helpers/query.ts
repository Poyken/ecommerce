/**
 * =====================================================================
 * QUERY HELPERS - Tối ưu Database Queries
 * =====================================================================
 *
 * =====================================================================
 */

/**
 * Tính toán skip và take cho pagination từ page và limit.
 */
export function getPaginationParams(page: number = 1, limit: number = 10) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

/**
 * Tạo metadata pagination cho response.
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
) {
  const lastPage = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    lastPage,
    hasPrevPage: page > 1,
    hasNextPage: page < lastPage,
  };
}

/**
 * Parse sort string thành Prisma orderBy format.
 *
 * @param sortString - Sort string (VD: "createdAt:desc,name:asc")
 * @param allowedFields - Danh sách các field được phép sort
 * @returns Prisma orderBy object
 *
 * @example
 * parseSortString("price:asc,name:desc", ["price", "name", "createdAt"])
 * // => [{ price: "asc" }, { name: "desc" }]
 */
export function parseSortString(
  sortString: string | undefined,
  allowedFields: string[],
): Array<Record<string, 'asc' | 'desc'>> {
  if (!sortString) {
    return [{ createdAt: 'desc' }]; // Default sort
  }

  const orderBy: Array<Record<string, 'asc' | 'desc'>> = [];

  const sortParts = sortString.split(',');

  for (const part of sortParts) {
    const [field, direction = 'asc'] = part.trim().split(':');

    // Validate field được phép
    if (allowedFields.includes(field)) {
      const safeDirection = direction.toLowerCase() === 'desc' ? 'desc' : 'asc';
      orderBy.push({ [field]: safeDirection });
    }
  }

  return orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }];
}

/**
 * Base select options cho các entity thường dùng.
 * Tránh SELECT * bằng cách chỉ định rõ các field cần thiết.
 */
export const BASE_SELECTS = {
  // Product listing (không cần full description)
  productList: {
    id: true,
    name: true,
    slug: true,
    price: true,
    compareAtPrice: true,
    images: true,
    status: true,
    createdAt: true,
  },

  // Product detail (cần full info)
  productDetail: {
    id: true,
    name: true,
    slug: true,
    description: true,
    price: true,
    compareAtPrice: true,
    images: true,
    status: true,
    categoryId: true,
    brandId: true,
    attributes: true,
    createdAt: true,
    updatedAt: true,
  },

  // User profile (không lấy password)
  userProfile: {
    id: true,
    name: true,
    email: true,
    avatar: true,
    phone: true,
    createdAt: true,
  },

  // Order list (tóm tắt)
  orderList: {
    id: true,
    orderNumber: true,
    status: true,
    total: true,
    createdAt: true,
  },

  // Category list
  categoryList: {
    id: true,
    name: true,
    slug: true,
    image: true,
    parentId: true,
  },
} as const;

/**
 * Tạo include options cho eager loading có điều kiện.
 */
export function conditionalInclude<T extends Record<string, unknown>>(
  condition: boolean,
  include: T,
): T | undefined {
  return condition ? include : undefined;
}

/**
 * Batch fetch helper - gom nhiều ID thành một query.
 */
export function createBatchLoader<T extends { id: string }>(
  fetchFn: (ids: string[]) => Promise<T[]>,
) {
  const cache = new Map<string, T>();
  const pending = new Map<string, Promise<T | null>>();

  return async function load(id: string): Promise<T | null> {
    // Check cache
    if (cache.has(id)) {
      return cache.get(id)!;
    }

    // Check pending
    if (pending.has(id)) {
      return pending.get(id)!;
    }

    // Fetch
    const promise = fetchFn([id]).then((results) => {
      const result = results.find((r) => r.id === id) || null;
      if (result) {
        cache.set(id, result);
      }
      pending.delete(id);
      return result;
    });

    pending.set(id, promise);
    return promise;
  };
}

/**
 * Filter builder helper - tạo Prisma where clause từ query params.
 */
export function buildWhereClause<T extends Record<string, unknown>>(
  filters: Partial<T>,
  config: {
    likeFields?: (keyof T)[];
    exactFields?: (keyof T)[];
    rangeFields?: (keyof T)[];
  } = {},
): Record<string, unknown> {
  const { likeFields = [], exactFields = [], rangeFields = [] } = config;
  const where: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (likeFields.includes(key as keyof T)) {
      where[key] = { contains: value, mode: 'insensitive' };
    } else if (exactFields.includes(key as keyof T)) {
      where[key] = value;
    } else if (rangeFields.includes(key as keyof T)) {
      // Expect value to be { min?: number, max?: number }
      const range = value as { min?: number; max?: number };
      if (range.min !== undefined || range.max !== undefined) {
        where[key] = {
          ...(range.min !== undefined && { gte: range.min }),
          ...(range.max !== undefined && { lte: range.max }),
        };
      }
    }
  });

  return where;
}
