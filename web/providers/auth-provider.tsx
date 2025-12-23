/**
 * =====================================================================
 * AUTH PROVIDER - Quản lý phân quyền (RBAC)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ROLE-BASED ACCESS CONTROL (RBAC):
 * - Hệ thống sử dụng Permissions thay vì chỉ dùng Role (vd: "admin:read" thay vì "ADMIN").
 * - Giúp phân quyền linh hoạt hơn (Granular permissions).
 *
 * 2. CLIENT-SIDE PERMISSION CHECK:
 * - `AuthProvider` lưu danh sách permissions vào React Context.
 * - `useAuth()` hook cho phép bất kỳ component nào cũng có thể check quyền (`hasPermission`).
 * - Lưu ý: Đây chỉ là UI Guard. Backend vẫn phải check lại permission cho mỗi API request.
 *
 * 3. HYDRATION STRATEGY:
 * - `initialPermissions` được truyền từ Server Component (Layout) để tránh nháy giao diện.
 * - Nếu thiếu, `useEffect` sẽ fetch lại từ Server Action.
 * =====================================================================
 */

"use client";
import { getPermissionsAction } from "@/actions/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

/**
 * Giá trị được cung cấp bởi AuthContext.
 */
interface AuthContextType {
  permissions: string[];
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  permissions: [],
  isAuthenticated: false,
  hasPermission: () => false,
});

export function AuthProvider({
  children,
  initialPermissions,
  isAuthenticated = false,
}: {
  children: React.ReactNode;
  initialPermissions?: string[];
  isAuthenticated?: boolean;
}) {
  const [fetchedPermissions, setFetchedPermissions] = useState<string[]>([]);

  // Stable permissions array: merge server-side and client-side permissions
  const permissions = useMemo(() => {
    const combined = new Set<string>();
    if (initialPermissions) {
      initialPermissions.forEach((p) => combined.add(p));
    }
    fetchedPermissions.forEach((p) => combined.add(p));
    return Array.from(combined);
  }, [initialPermissions, fetchedPermissions]);

  useEffect(() => {
    // Only fetch on client if initialPermissions was NEVER provided (undefined).
    // If server provided empty array [], trust it (user is not logged in).
    // This prevents duplicate API calls when switching language or navigating.
    if (initialPermissions === undefined) {
      const fetchPermissions = async () => {
        try {
          const perms = await getPermissionsAction();
          if (perms && perms.length > 0) {
            setFetchedPermissions(perms);
          }
        } catch (error) {
          console.error("Failed to fetch permissions:", error);
        }
      };
      fetchPermissions();
    }
  }, [initialPermissions]); // Run when initialPermissions changes

  /**
   * Memoized permission check function.
   */
  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      permissions,
      isAuthenticated,
      hasPermission,
    }),
    [permissions, isAuthenticated, hasPermission]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// =============================================================================
// 🎣 CUSTOM HOOK - Hook để sử dụng Auth Context
// =============================================================================

/**
 * Hook để truy cập auth context từ bất kỳ Client Component nào.
 *
 * @returns AuthContextType với permissions array và hasPermission function
 *
 * @example
 * // Kiểm tra quyền cụ thể
 * const { hasPermission } = useAuth();
 * const canManageUsers = hasPermission("admin:users");
 *
 * @example
 * // Lấy tất cả permissions
 * const { permissions } = useAuth();
 * console.log("User permissions:", permissions);
 *
 * @example
 * // Conditional rendering
 * {hasPermission("write:products") && (
 *   <Button onClick={handleEdit}>Sửa sản phẩm</Button>
 * )}
 */
export function useAuth() {
  return useContext(AuthContext);
}
