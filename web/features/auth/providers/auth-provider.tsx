/**
 * =====================================================================
 * AUTH PROVIDER - Quản lý phân quyền (RBAC)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RBAC (Role-Based Access Control):
 * - Thay vì chỉ check Role (Admin/User), ta check PERMISSION (Quyền).
 * - VD: `hasPermission("product:create")`.
 * - Linh hoạt hơn: Một Role có thể có nhiều Permission. Admin có thể tạo user, nhưng Manager thì không.
 *
 * 2. HYDRATION (Bơm dữ liệu):
 * - `initialPermissions` được lấy từ Server (trong Layout) truyền xuống.
 * - Giúp UI hiển thị đúng quyền ngay lập tức mà không cần chờ loading spinner (Client-side fetching).
 *
 * 3. SECURITY NOTE:
 * - Việc check permission ở Client (`hasPermission`) chỉ là để ẩn hiện UI (UX).
 * - BẮT BUỘC phải check lại ở Backend/API để đảm bảo an toàn thực sự.
 * =====================================================================
 */

"use client";
import { getPermissionsAction } from "@/features/auth/actions";
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
 * Cấu trúc dữ liệu của AuthContext.
 */
interface AuthContextType {
  permissions: string[]; // Danh sách các quyền của user
  isAuthenticated: boolean; // Trạng thái đã đăng nhập hay chưa
  hasPermission: (permission: string) => boolean; // Hàm kiểm tra quyền nhanh
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

  // Danh sách quyền ổn định: Gộp quyền từ Server-side và Client-side lại làm một.
  const permissions = useMemo(() => {
    const combined = new Set<string>();
    if (initialPermissions) {
      initialPermissions.forEach((p) => combined.add(p));
    }
    fetchedPermissions.forEach((p) => combined.add(p));
    return Array.from(combined);
  }, [initialPermissions, fetchedPermissions]);

  useEffect(() => {
    // Chỉ fetch thêm quyền ở Client nếu initialPermissions KHÔNG được truyền xuống (undefined).
    // Nếu Server đã truyền xuống mảng rỗng [], ta tin tưởng dữ liệu đó (user chưa login).
    // Điều này giúp tránh gọi API thừa khi chuyển ngôn ngữ hoặc chuyển trang.
    if (initialPermissions === undefined) {
      const fetchPermissions = async () => {
        try {
          const perms = await getPermissionsAction();
          if (perms && perms.length > 0) {
            setFetchedPermissions(perms);
          }
        } catch (error) {
          console.error("Lỗi khi lấy danh sách quyền:", error);
        }
      };
      fetchPermissions();
    }
  }, [initialPermissions]); // Chạy lại nếu initialPermissions thay đổi

  /**
   * Hàm kiểm tra quyền (được memoize để không bị khởi tạo lại vô ích).
   */
  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  // Lưu trữ giá trị context vào useMemo để tránh re-render các component con không cần thiết
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
 * Hook để truy cập thông tin auth từ bất kỳ Client Component nào.
 *
 * @returns {AuthContextType} Bao gồm mảng permissions và hàm hasPermission
 *
 * @example
 * // 1. Kiểm tra một quyền cụ thể
 * const { hasPermission } = useAuth();
 * const canManageUsers = hasPermission("admin:users");
 *
 * @example
 * // 2. Lấy tất cả danh sách quyền
 * const { permissions } = useAuth();
 * console.log("Danh sách quyền của user:", permissions);
 *
 * @example
 * // 3. Ẩn hiện giao diện theo quyền (Conditional rendering)
 * {hasPermission("product:edit") && (
 *   <button onClick={handleEdit}>Chỉnh sửa sản phẩm</button>
 * )}
 */
export function useAuth() {
  return useContext(AuthContext);
}
