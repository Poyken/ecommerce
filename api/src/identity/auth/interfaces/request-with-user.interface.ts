import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    email?: string;
    tenantId?: string;
    roles?: string[];
    permissions: string[];
    jti?: string;
    [key: string]: unknown;
  };
}
/**
 * =====================================================================
 * REQUEST WITH USER - Interface mở rộng
 * =====================================================================
 *
 * =====================================================================
 */
