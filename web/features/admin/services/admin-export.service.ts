import { http } from "@/lib/http";

/**
 * =====================================================================
 * ADMIN EXPORT SERVICE - Domain logic for data exports
 * =====================================================================
 */

export const adminExportService = {
  /**
   * Export orders to Excel
   */
  exportOrders: async () => {
    return http<Blob>("/orders/export/excel", {
      skipAuth: false,
      responseType: "blob",
    });
  },
};
