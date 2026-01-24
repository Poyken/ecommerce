import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from './tenant.context';
import { ForbiddenException, Logger } from '@nestjs/common';
import { Tenant } from '@prisma/client';

/**
 * =====================================================================
 * BASE TENANT SERVICE - LỚP CƠ SỞ CHO CÁC SERVICE ĐA TENANT
 * =====================================================================
 *
 * =====================================================================
 */
export abstract class BaseTenantService {
  protected readonly logger: Logger;

  constructor(protected readonly prisma: PrismaService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Lấy tenantId từ context hiện tại.
   * Nếu không có tenant context, sẽ throw ForbiddenException.
   *
   * @returns tenantId string
   * @throws ForbiddenException nếu không có tenant context
   */
  protected get tenantId(): string {
    const tenant = this.tenant;
    if (!tenant) {
      this.logger.error('Attempted to access tenantId without tenant context');
      throw new ForbiddenException(
        'Tenant context is required for this operation',
      );
    }
    return tenant.id;
  }

  /**
   * Lấy toàn bộ Tenant object từ context.
   * Có thể null nếu là super-admin hoặc public endpoint.
   *
   * @returns Tenant object hoặc null
   */
  protected get tenant(): Tenant | null {
    return getTenant() || null;
  }

  /**
   * Kiểm tra xem có tenant context hay không.
   * Dùng cho các endpoint có thể hoạt động với hoặc không có tenant.
   *
   * @returns boolean
   */
  protected get hasTenantContext(): boolean {
    return !!getTenant();
  }

  /**
   * Yêu cầu bắt buộc phải có tenant context.
   * Gọi method này ở đầu các method quan trọng để fail-fast.
   *
   * @throws ForbiddenException nếu không có tenant context
   */
  protected requireTenant(): Tenant {
    const tenant = this.tenant;
    if (!tenant) {
      this.logger.warn('Required tenant context not found');
      throw new ForbiddenException(
        'This operation requires a valid tenant context',
      );
    }
    return tenant;
  }

  /**
   * Tạo điều kiện where cơ bản với tenantId.
   * Tiện ích để tránh lặp code.
   *
   * @param additionalWhere - Điều kiện where bổ sung
   * @returns Object where condition
   */
  protected tenantWhere<T extends Record<string, unknown>>(
    additionalWhere?: T,
  ): T & { tenantId: string } {
    return {
      ...additionalWhere,
      tenantId: this.tenantId,
    } as T & { tenantId: string };
  }

  /**
   * Tạo data object với tenantId cho create operations.
   *
   * @param data - Data object gốc
   * @returns Data object với tenantId
   */
  protected withTenantId<T extends Record<string, unknown>>(
    data: T,
  ): T & { tenantId: string } {
    return {
      ...data,
      tenantId: this.tenantId,
    };
  }

  /**
   * Log debug message với tenant context.
   * Tự động thêm tenantId vào log để dễ trace.
   *
   * @param message - Message cần log
   * @param data - Data bổ sung (optional)
   */
  protected logWithTenant(
    message: string,
    data?: Record<string, unknown>,
  ): void {
    const tenant = this.tenant;
    this.logger.debug({
      message,
      tenantId: tenant?.id || 'NO_TENANT',
      tenantName: tenant?.name || 'N/A',
      ...data,
    });
  }
}
