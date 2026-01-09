"use server";

import { http } from "@/lib/http";
import { ApiResponse, ActionResult, SecurityStats } from "@/types/dtos";
import { AuditLog } from "@/types/models";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/lib/server-action-wrapper";

/**
 * =====================================================================
 * SECURITY & AUDIT ACTIONS - Quản lý an ninh & Nhật ký hệ thống
 * =====================================================================
 */

export async function getSecurityStatsAction(): Promise<
  ActionResult<SecurityStats>
> {
  return wrapServerAction(
    () => http<ApiResponse<SecurityStats>>("/security/stats"),
    "Failed to fetch security stats"
  );
}

export async function getLockdownStatusAction(): Promise<
  ActionResult<{ isLockdown: boolean }>
> {
  return wrapServerAction(
    () => http<ApiResponse<{ isLockdown: boolean }>>("/security/lockdown"),
    "Failed to fetch lockdown status"
  );
}

export async function toggleLockdownAction(
  enabled: boolean
): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<any>>("/security/lockdown", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    revalidatePath("/super-admin/security");
    revalidatePath("/");
    return res.data;
  }, "Failed to toggle lockdown");
}

export async function getSuperAdminWhitelistAction(): Promise<
  ActionResult<string[]>
> {
  return wrapServerAction(
    () => http<ApiResponse<string[]>>("/security/whitelist"),
    "Failed to fetch whitelist"
  );
}

export async function updateSuperAdminWhitelistAction(
  ips: string[]
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http("/security/whitelist", {
      method: "PUT",
      body: JSON.stringify({ ips }),
    });
    revalidatePath("/super-admin/security");
  }, "Failed to update whitelist");
}

export async function getMyIpAction(): Promise<ActionResult<{ ip: string }>> {
  return wrapServerAction(
    () => http<ApiResponse<{ ip: string }>>("/security/my-ip"),
    "Failed to fetch IP"
  );
}

export async function getAuditLogsAction(
  params: any = {}
): Promise<ActionResult<AuditLog[]>> {
  return wrapServerAction(
    () => http<ApiResponse<AuditLog[]>>("/audit-logs", { params }),
    "Failed to fetch audit logs"
  );
}
