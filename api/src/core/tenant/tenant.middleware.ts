import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Get Host header (e.g. "tenant-a.com" or "localhost:3000")
    // Clean host (remove port)
    const rawHost = (req.headers['x-tenant-domain'] ||
      req.headers.host ||
      '') as string;
    const domain = rawHost.split(':')[0];

    // 2. Find Tenant
    // Note: In production, you should CACHE this lookup (Redis/Memory)
    // to avoid hitting DB on every request.
    const tenant = await this.prisma.tenant.findUnique({
      where: { domain },
    });

    // 3. Store in Context
    if (tenant) {
      tenantStorage.run(tenant, () => {
        next();
      });
    } else {
      // Optional: Fallback to a default tenant or proceed without context
      // Depending on your requirements, you might verify "is this a public route?"
      next();
    }
  }
}
