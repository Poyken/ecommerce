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
 *    - [Hướng dẫn sử dụng] *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Context Propagation: Truyền thông tin "Cửa hàng hiện tại" (Tenant) đi sâu vào các tầng service/repository mà không cần truyền tham số `tenantId` qua từng hàm.
 * - Thread Safety: Đảm bảo request của User A không bị lẫn thông tin với User B dù server đang xử lý song song hàng nghìn request.

 * =====================================================================
 */

import { Tenant } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<Tenant>();

export function getTenant() {
  return tenantStorage.getStore();
}
