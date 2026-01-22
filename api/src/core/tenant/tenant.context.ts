/**
 * =====================================================================
 * TENANT.CONTEXT.TS
 * =====================================================================
 *
 * =====================================================================
 */

import { Tenant } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<Tenant | undefined>();

export function getTenant() {
  return tenantStorage.getStore();
}
