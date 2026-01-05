import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import * as cacheManager from 'cache-manager';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Get Host header (e.g. "tenant-a.com" or "localhost:3000")
    // Clean host (remove port)
    const rawHost = (req.headers['x-tenant-domain'] ||
      req.headers.host ||
      '') as string;
    const domain = rawHost.split(':')[0];

    // 2. Find Tenant (Cached)
    const cacheKey = `tenant:${domain}`;
    let tenant: Tenant | null | undefined =
      await this.cacheManager.get<Tenant>(cacheKey);

    if (!tenant) {
      tenant = await this.prisma.tenant.findUnique({
        where: { domain },
      });

      if (tenant) {
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
      next();
    }
  }
}
