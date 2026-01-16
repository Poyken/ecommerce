import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import { ApiResponse, SecurityStats } from "@/types/dtos";
import { AuditLog } from "@/types/models";

/**
 * =====================================================================
 * ADMIN SECURITY SERVICE - Domain logic for security & audit
 * =====================================================================
 */

export const adminSecurityService = {
  getSecurityStats: async () => {
    return http.get<ApiResponse<SecurityStats>>("/admin/security/stats");
  },

  getLockdownStatus: async () => {
    return http.get<ApiResponse<{ isLockdown: boolean }>>(
      "/admin/security/lockdown-status"
    );
  },

  toggleLockdown: async (isEnabled: boolean) => {
    return http.post<ApiResponse<any>>("/admin/security/lockdown", {
      isEnabled,
    });
  },

  getWhitelist: async () => {
    return http.get<ApiResponse<string[]>>("/admin/security/whitelist");
  },

  updateWhitelist: async (ips: string[]) => {
    return http.post("/admin/security/whitelist", { ips });
  },

  getMyIp: async () => {
    return http.get<ApiResponse<{ ip: string }>>("/admin/security/my-ip");
  },

  getAuditLogs: async (paramsOrPage: any = {}) => {
    const { roles, ...rest } = paramsOrPage;
    const params = normalizePaginationParams(rest);
    if (roles) {
      params.roles = Array.isArray(roles) ? roles.join(",") : roles;
    }
    return http.get<ApiResponse<AuditLog[]>>("/audit", { params });
  },
};
