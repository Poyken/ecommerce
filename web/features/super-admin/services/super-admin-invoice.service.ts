import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
// Assuming Invoice type exists in DTOs or models, checking models...
// Yes, models.ts has Invoice (lines 724).
import { Invoice } from "@/types/models";

/**
 * =====================================================================
 * SUPER ADMIN INVOICE SERVICE - Domain logic for invoices
 * =====================================================================
 */

export const superAdminInvoiceService = {
  getInvoices: async (page = 1, limit = 20) => {
    return http.get<ApiResponse<Invoice[]>>(
      `/invoices?page=${page}&limit=${limit}`
    );
  },

  updateInvoiceStatus: async (id: string, status: string) => {
    return http.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, {
      status,
    });
  },
};
