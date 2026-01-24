import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
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
 * =================================================================================================
 */
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

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
    this.logger.debug(
      `Resolving tenant for domain: "${domain}" (x-tenant-domain: "${String(req.headers['x-tenant-domain'] || '')}", host: "${String(req.headers.host || '')}")`,
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
          this.logger.warn(
            `Attempt to access inactive tenant: ${tenant.name} (${domain})`,
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
    if (!tenant && process.env.NODE_ENV === 'test') {
      // For E2E tests, if no tenant is resolved via headers, fall back to the first available tenant
      tenant = await this.prisma.tenant.findFirst();
    }

    if (tenant) {
      tenantStorage.run(tenant, () => {
        next();
      });
    } else {
      // [SECURITY] If a specific tenant domain was requested but not found,
      // do NOT allow bypass to global context unless it's a system-whitelisted domain.
      const requestedTenantDomain = req.headers['x-tenant-domain'];
      if (requestedTenantDomain && requestedTenantDomain !== '') {
        this.logger.error(
          `Unauthorized Tenant access: domain="${domain}", x-tenant-domain="${String(requestedTenantDomain || '')}"`,
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
