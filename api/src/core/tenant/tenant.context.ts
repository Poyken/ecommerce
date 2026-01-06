/**
 * =====================================================================
 * TENANT.CONTEXT.TS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * [Mô tả ngắn gọn mục đích của file]
 *
 * 1. CHỨC NĂNG:
 *    - [Mô tả các chức năng chính]
 *
 * 2. CÁCH SỬ DỤNG:
 *    - [Hướng dẫn sử dụng]
 * =====================================================================
 */

import { Tenant } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<Tenant>();

export function getTenant() {
  return tenantStorage.getStore();
}
