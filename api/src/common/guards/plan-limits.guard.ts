import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';

/**
 * =================================================================================================
 * PLAN LIMIT TYPES
 * =================================================================================================
 */
export type PlanLimitType =
  | 'product'
  | 'storage'
  | 'staff'
  | 'warehouse'
  | 'order';

export const PLAN_LIMIT_KEY = 'planLimit';

/**
 * =================================================================================================
 * PLAN LIMIT DECORATOR
 * =================================================================================================
 *
 * Sử dụng decorator này để kiểm tra limit trước khi tạo resource
 *
 * @example
 * @CheckPlanLimit('product')
 * @Post()
 * async createProduct(@Body() dto: CreateProductDto) { ... }
 */
export function CheckPlanLimit(limitType: PlanLimitType) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PLAN_LIMIT_KEY, limitType, descriptor.value);
    return descriptor;
  };
}

/**
 * =================================================================================================
 * PLAN LIMITS GUARD - KIỂM TRA GIỚI HẠN GÓI DỊCH VỤ
 * =================================================================================================
 *
 * =================================================================================================
 */
@Injectable()
export class PlanLimitsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<PlanLimitType>(
      PLAN_LIMIT_KEY,
      context.getHandler(),
    );

    // Nếu không có decorator, cho phép request
    if (!limitType) {
      return true;
    }

    const tenant = getTenant();

    // Nếu không có tenant context, cho phép (sẽ bị chặn bởi TenantGuard)
    if (!tenant) {
      return true;
    }

    // Lấy thông tin tenant mới nhất từ DB
    const tenantData = await this.prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: {
        id: true,
        plan: true,
        productLimit: true,
        storageLimit: true,
        staffLimit: true,
        currentProductCount: true,
        currentStorageUsed: true,
        currentStaffCount: true,
      },
    });

    if (!tenantData) {
      return true;
    }

    // Kiểm tra limit theo loại
    let isWithinLimit = true;
    let limitInfo = {
      current: 0,
      limit: 0,
      type: '',
      message: '',
    };

    switch (limitType) {
      case 'product':
        isWithinLimit =
          tenantData.currentProductCount < tenantData.productLimit;
        limitInfo = {
          current: tenantData.currentProductCount,
          limit: tenantData.productLimit,
          type: 'sản phẩm',
          message: `Bạn đã đạt giới hạn ${tenantData.productLimit} sản phẩm của gói ${tenantData.plan}.`,
        };
        break;

      case 'storage':
        // Storage is checked in MB
        isWithinLimit = tenantData.currentStorageUsed < tenantData.storageLimit;
        limitInfo = {
          current: tenantData.currentStorageUsed,
          limit: tenantData.storageLimit,
          type: 'dung lượng (MB)',
          message: `Bạn đã sử dụng hết ${tenantData.storageLimit}MB dung lượng của gói ${tenantData.plan}.`,
        };
        break;

      case 'staff':
        isWithinLimit = tenantData.currentStaffCount < tenantData.staffLimit;
        limitInfo = {
          current: tenantData.currentStaffCount,
          limit: tenantData.staffLimit,
          type: 'nhân viên',
          message: `Bạn đã đạt giới hạn ${tenantData.staffLimit} nhân viên của gói ${tenantData.plan}.`,
        };
        break;

      case 'warehouse': {
        // Count warehouses
        const warehouseCount = await this.prisma.warehouse.count({
          where: { tenantId: tenant.id },
        });
        // Limit based on plan (can be configurable)
        const warehouseLimit =
          tenantData.plan === 'BASIC' ? 1 : tenantData.plan === 'PRO' ? 5 : 999;
        isWithinLimit = warehouseCount < warehouseLimit;
        limitInfo = {
          current: warehouseCount,
          limit: warehouseLimit,
          type: 'kho hàng',
          message: `Bạn đã đạt giới hạn ${warehouseLimit} kho hàng của gói ${tenantData.plan}.`,
        };
        break;
      }

      default:
        // Không kiểm tra nếu không có loại nào match
        return true;
    }

    if (!isWithinLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: limitInfo.message,
          error: 'PLAN_LIMIT_EXCEEDED',
          details: {
            limitType,
            current: limitInfo.current,
            limit: limitInfo.limit,
            plan: tenantData.plan,
            upgradeUrl: '/admin/subscription',
          },
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}

/**
 * =================================================================================================
 * HELPER: Increment counter sau khi tạo resource
 * =================================================================================================
 *
 * Sử dụng trong service sau khi tạo resource thành công
 */
export async function incrementPlanCounter(
  prisma: PrismaService,
  tenantId: string,
  counterType: 'product' | 'storage' | 'staff',
  amount: number = 1,
): Promise<void> {
  const updateData: any = {};

  switch (counterType) {
    case 'product':
      updateData.currentProductCount = { increment: amount };
      break;
    case 'storage':
      updateData.currentStorageUsed = { increment: amount };
      break;
    case 'staff':
      updateData.currentStaffCount = { increment: amount };
      break;
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: updateData,
  });
}

export async function decrementPlanCounter(
  prisma: PrismaService,
  tenantId: string,
  counterType: 'product' | 'storage' | 'staff',
  amount: number = 1,
): Promise<void> {
  const updateData: any = {};

  switch (counterType) {
    case 'product':
      updateData.currentProductCount = { decrement: amount };
      break;
    case 'storage':
      updateData.currentStorageUsed = { decrement: amount };
      break;
    case 'staff':
      updateData.currentStaffCount = { decrement: amount };
      break;
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: updateData,
  });
}
