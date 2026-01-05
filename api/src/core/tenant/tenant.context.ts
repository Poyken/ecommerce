import { Tenant } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<Tenant>();

export function getTenant() {
  return tenantStorage.getStore();
}
