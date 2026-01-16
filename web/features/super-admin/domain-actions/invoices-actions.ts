/**
 * =====================================================================
 * INVOICES ACTIONS (Super Admin Side) - Quản lý Hóa đơn của Tenants
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 * - Module này dành cho Admin tổng (SuperAdmin) để quản lý việc thanh toán
 *   của các Tenants (chủ shop thuê hệ thống).
 *
 * 2. ZOD VALIDATION:
 * - `getInvoicesSchema`: Validate page/limit (tránh user truyền số âm, chữ...)
 * - `updateStatusSchema`: Đảm bảo status là string hợp lệ.
 *
 * 3. REVALIDATE:
 * - Sau khi update trạng thái hóa đơn (VD: Paid -> Cancelled), cần clear cache
 *   để trang danh sách hiển thị đúng ngay lập tức. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Revenue Tracking: Giúp Super Admin theo dõi dòng tiền đổ về từ hàng nghìn shop trên hệ thống theo thời gian thực.
 * - Automated Billing: Làm cơ sở để xuất hóa đơn VAT và gửi email thông báo nhắc nợ tự động cho các khách hàng quá hạn.
 *
 * =====================================================================
 */
"use server";

import { protectedActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { superAdminInvoiceService } from "../services/super-admin-invoice.service";

const getInvoicesSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
});

export const getInvoicesAction = protectedActionClient
  .schema(getInvoicesSchema)
  .action(async ({ parsedInput: { page, limit } }) => {
    return superAdminInvoiceService.getInvoices(page, limit);
  });

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const updateInvoiceStatusAction = protectedActionClient
  .schema(updateStatusSchema)
  .action(async ({ parsedInput: { id, status } }) => {
    const res = await superAdminInvoiceService.updateInvoiceStatus(id, status);
    revalidatePath("/super-admin/invoices");
    return res;
  });
