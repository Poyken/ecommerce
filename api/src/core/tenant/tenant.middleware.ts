import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import * as cacheManager from 'cache-manager';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from './tenant.context';

@Injectable()
/**
 * =================================================================================================
 * TENANT MIDDLEWARE - LỚP BẢO VỆ ĐẦU TIÊN CỦA REQUEST
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NHIỆM VỤ:
 *    - Xác định xem "Ai đang gọi cửa?". Request này đến từ cửa hàng nào (Store A hay Store B)?
 *    - Middleware này chạy TRƯỚC KHI request đến được Controller.
 *
 * 2. CÁCH XÁC ĐỊNH TENANT (DOMAIN RESOLUTION):
 *    - Dựa vào `Host Header` hoặc `x-tenant-domain`.
 *    - Ví dụ: User truy cập `shop-giay.platform.com` -> Hệ thống tách lấy `shop-giay` để tìm trong DB.
 *
 * 3. HIỆU NĂNG (PERFORMANCE & CACHING):
 *    - Vì Middleware chạy trên 100% request, nên việc query DB ở đây sẽ làm chậm toàn bộ hệ thống.
 *    - Giải pháp: Dùng Caching (Redis/Memory).
 *    - Logic: Lần đầu query DB -> Lưu vào Cache 60s. Các lần sau lấy từ Cache -> Siêu nhanh.
 *
 * 4. CONTEXT (ASYNC LOCAL STORAGE):
 *    - Sau khi tìm được Tenant, ta cần truyền nó cho các lớp bên trong (Service, Repo) dùng.
 *    - Thay vì truyền tham suố `function(tenantId)` qua hàng chục hàm, ta dùng `tenantStorage.run()`.
 *    - Nó giống như một "biến toàn cục" nhưng chỉ tồn tại trong vòng đời của 1 request duy nhất (Thread-safe). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - SaaS Multi-tenancy: Cho phép một source code phục vụ hàng nghìn cửa hàng (tenants) khác nhau, mỗi cửa hàng có dữ liệu riêng biệt.
 * - Performance Optimization: Nhờ caching tầng Middleware, việc xác định cửa hàng tốn < 1ms, không làm chậm request chính.
 * - Thread Safety: Đảm bảo request của User A (Store X) không bao giờ nhìn thấy dữ liệu của User B (Store Y) nhờ `AsyncLocalStorage`.

 * =================================================================================================
 */
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Get Host header (e.g. "tenant-a.com" or "shop-a.platform.com")
    const rawHost = (req.headers['x-tenant-domain'] ||
      req.headers.host ||
      '') as string;
    const domain = rawHost.split(':')[0];
    console.log(
      `[TenantMiddleware] Resolving tenant for domain: "${domain}" (from x-tenant-domain: "${req.headers['x-tenant-domain']}", host: "${req.headers.host}")`,
    );

    // 2. Find Tenant (Cached)
    const cacheKey = `tenant:${domain}`;
    let tenant: Tenant | null | undefined =
      await this.cacheManager.get<Tenant>(cacheKey);

    if (!tenant) {
      // Advanced Resolution: Check customDomain, subdomain, or legacy domain field
      const lowerDomain = domain.toLowerCase();
      tenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [
            { customDomain: { equals: lowerDomain, mode: 'insensitive' } },
            {
              subdomain: {
                equals: lowerDomain.split('.')[0],
                mode: 'insensitive',
              },
            },
            { domain: { equals: lowerDomain, mode: 'insensitive' } },
          ],
        },
      });

      if (tenant) {
        // [SECURITY] Check if tenant is active/suspended
        if (!tenant.isActive) {
          console.warn(
            `[TenantMiddleware] Attempt to access inactive tenant: ${tenant.name} (${domain})`,
          );
          return res.status(403).json({
            error: 'Store suspended',
            message:
              'This store is currently not active. Please contact support.',
            reason: tenant.suspensionReason,
          });
        }

        // Cache for 1 minute (60 * 1000 ms)
        await this.cacheManager.set(cacheKey, tenant, 60 * 1000);
      }
    }

    // 3. Store in Context
    if (tenant) {
      tenantStorage.run(tenant, () => {
        next();
      });
    } else {
      // [SECURITY] If a specific tenant domain was requested but not found,
      // do NOT allow bypass to global context unless it's a system-whitelisted domain.
      const requestedTenantDomain = req.headers['x-tenant-domain'];
      if (requestedTenantDomain && requestedTenantDomain !== '') {
        console.error(
          `[TenantMiddleware] Unauthorized Tenant access: domain="${domain}", x-tenant-domain="${requestedTenantDomain}"`,
        );
        return res.status(403).json({
          error: 'Unauthorized Tenant',
          message:
            'The requested store domain does not exist or is not registered.',
          debug: { domain, requestedTenantDomain },
        });
      }
      next();
    }
  }
}
