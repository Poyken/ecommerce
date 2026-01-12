/**
 * =====================================================================
 * SECURITY ACTIONS - Quản lý IP & Audit Log
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. LOCKDOWN MODE:
 * - `toggleLockdownAction`: Khi bật chế độ này, toàn bộ hệ thống sẽ từ chối
 *   mọi truy cập (trừ IP trong Whitelist).
 * - Dùng trong trường hợp khẩn cấp (bị tấn công DDoS, DB leak data...).
 *
 * 2. IP WHITELIST:
 * - Danh sách IP được phép truy cập Dashboard (Admin/SuperAdmin) để tăng bảo mật.
 * - `getMyIpAction`: Tiện ích giúp Admin lấy IP hiện tại để add nhanh vào whitelist. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */
"use server";

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse, ActionResult, SecurityStats } from "@/types/dtos";
import { AuditLog } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

/**
 * =====================================================================
 * SECURITY & AUDIT ACTIONS - Quản lý an ninh & Nhật ký hệ thống
 * =====================================================================
 */

export async function getSecurityStatsAction(): Promise<
  ActionResult<SecurityStats>
> {
  return wrapServerAction(
    () => http<ApiResponse<SecurityStats>>("/admin/security/stats"),
    "Failed to fetch security stats"
  );
}

export async function getLockdownStatusAction(): Promise<
  ActionResult<{ isLockdown: boolean }>
> {
  return wrapServerAction(
    () =>
      http<ApiResponse<{ isLockdown: boolean }>>(
        "/admin/security/lockdown-status"
      ),
    "Failed to fetch lockdown status"
  );
}

export async function toggleLockdownAction(
  isEnabled: boolean
): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>("/admin/security/lockdown", {
      method: "POST",
      body: JSON.stringify({ isEnabled }),
    });
    REVALIDATE.superAdmin.security();
    REVALIDATE.path("/", "page");
    return res.data;
  }, "Failed to toggle lockdown");
}

export async function getSuperAdminWhitelistAction(): Promise<
  ActionResult<string[]>
> {
  return wrapServerAction(
    () => http<ApiResponse<string[]>>("/admin/security/whitelist"),
    "Failed to fetch whitelist"
  );
}

export async function updateSuperAdminWhitelistAction(
  ips: string[]
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http("/admin/security/whitelist", {
      method: "POST",
      body: JSON.stringify({ ips }),
    });
    REVALIDATE.superAdmin.security();
  }, "Failed to update whitelist");
}

export async function getMyIpAction(): Promise<ActionResult<{ ip: string }>> {
  return wrapServerAction(
    () => http<ApiResponse<{ ip: string }>>("/admin/security/my-ip"),
    "Failed to fetch IP"
  );
}

export async function getAuditLogsAction(
  paramsOrPage: any = {}
): Promise<ActionResult<AuditLog[]>> {
  const { roles, ...rest } = paramsOrPage;
  const params = normalizePaginationParams(rest);
  if (roles) {
    params.roles = Array.isArray(roles) ? roles.join(",") : roles;
  }
  return wrapServerAction(
    () => http<ApiResponse<AuditLog[]>>("/audit", { params }),
    "Failed to fetch audit logs"
  );
}
