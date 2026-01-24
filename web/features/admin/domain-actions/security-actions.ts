
"use server";

import { adminSecurityService } from "../services/admin-security.service";
import { ActionResult, SecurityStats } from "@/types/dtos";
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
    () => adminSecurityService.getSecurityStats(),
    "Failed to fetch security stats"
  );
}

export async function getLockdownStatusAction(): Promise<
  ActionResult<{ isLockdown: boolean }>
> {
  return wrapServerAction(
    () => adminSecurityService.getLockdownStatus(),
    "Failed to fetch lockdown status"
  );
}

export async function toggleLockdownAction(
  isEnabled: boolean
): Promise<ActionResult<any>> {
  return wrapServerAction(async () => {
    const res = await adminSecurityService.toggleLockdown(isEnabled);
    REVALIDATE.superAdmin.security();
    REVALIDATE.path("/", "page");
    return res.data;
  }, "Failed to toggle lockdown");
}

export async function getSuperAdminWhitelistAction(): Promise<
  ActionResult<string[]>
> {
  return wrapServerAction(
    () => adminSecurityService.getWhitelist(),
    "Failed to fetch whitelist"
  );
}

export async function updateSuperAdminWhitelistAction(
  ips: string[]
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminSecurityService.updateWhitelist(ips);
    REVALIDATE.superAdmin.security();
  }, "Failed to update whitelist");
}

export async function getMyIpAction(): Promise<ActionResult<{ ip: string }>> {
  return wrapServerAction(
    () => adminSecurityService.getMyIp(),
    "Failed to fetch IP"
  );
}

export async function getAuditLogsAction(
  paramsOrPage: any = {}
): Promise<ActionResult<AuditLog[]>> {
  return wrapServerAction(
    () => adminSecurityService.getAuditLogs(paramsOrPage),
    "Failed to fetch audit logs"
  );
}
