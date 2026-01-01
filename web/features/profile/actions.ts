/**
 * =====================================================================
 * PROFILE SERVER ACTIONS - Quản lý hồ sơ người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các Server Actions liên quan đến thông tin cá nhân của User:
 * - Lấy thông tin profile (`getProfileAction`)
 * - Cập nhật thông tin (Tên, Ảnh đại diện, Mật khẩu) (`updateProfileAction`)
 *
 * LƯU Ý KỸ THUẬT QUAN TRỌNG:
 * 1. CACHE DEDUPLICATION:
 *    - `getProfileAction` được bọc bởi `cache()` của React.
 *    - Giúp tránh việc gọi API `/auth/me` nhiều lần nếu component cha và con cùng cần profile trong 1 lần render.
 *
 * 2. SESSION VALIDATION:
 *    - Luôn kiểm tra `accessToken` từ Cookie.
 *    - Xử lý các case 401 (Unauthorized) để tự động force logout nếu phiên làm việc hết hạn.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { ProfileUpdateSchema } from "@/lib/schemas";
import { ApiResponse } from "@/types/dtos";
import { User } from "@/types/models";
import { revalidatePath } from "next/cache";
import { cache } from "react";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

// =============================================================================
// 📝 SERVER ACTIONS - Các hành động xử lý profile
// =============================================================================

/**
 * =====================================================================
 * PROFILE ACTIONS - Quản lý hồ sơ người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REACT CACHE (Deduplication):
 * - `cache(async () => ...)`: Giúp tránh gọi API `auth/me` nhiều lần trong cùng một lần render của React.
 * - Ví dụ: Header cần tên user, Sidebar cần avatar -> Chỉ gọi API 1 lần.
 *
 * 2. REVALIDATE PATH:
 * - Sau khi cập nhật profile (`updateProfileAction`), ta gọi `revalidatePath("/profile")`.
 * - Lệnh này bảo Next.js: "Dữ liệu trang này cũ rồi, hãy xóa cache và fetch lại mới ngay lập tức".
 * - Giúp UI cập nhật tên/ảnh mới ngay mà không cần F5.
 *
 * 3. FORM DATA HANDLING:
 * - Upload ảnh (`avatar`) bắt buộc dùng `FormData`.
 * - Logic: Nếu có ảnh -> Gửi FormData multipart. Nếu chỉ sửa text -> Gửi JSON cho nhẹ.
 * =====================================================================
 */

/**
 * Lấy thông tin profile của user đang đăng nhập.
 *
 * 📝 LƯU Ý KỸ THUẬT:
 * - Sử dụng React cache() để deduplicate requests trong cùng render
 * - Trả về { data } nếu thành công, { error } nếu thất bại
 * - Endpoint /auth/me trả về thông tin user từ access token
 *
 * @returns { data: UserProfile } hoặc { error: string }
 *
 * @example
 * // Trong Server Component
 * const profile = await getProfileAction();
 * if (profile.data) {
 *   console.log(`Hello, ${profile.data.firstName}!`);
 * }
 */
import { cookies } from "next/headers";

export const getProfileAction = cache(async () => {
  // Trigger dynamic access before try/catch to allow PPR to work correctly.
  // In Next.js 16, cookies() throws a special error during static prerender.
  await cookies();

  try {
    const res = await http<ApiResponse<User>>("/auth/me", {
      cache: "no-store",
      skipRedirectOn401: true,
    });
    return { data: res.data };
  } catch (error: unknown) {
    const message = (error as Error).message || "Failed to fetch profile";

    // Check for "User not found" specifically
    if (
      message.toLowerCase().includes("user") &&
      message.toLowerCase().includes("not found")
    ) {
      // Session is stale (DB reset?), clear it so user is logged out
      // await deleteSession(); // Cannot modify cookies in Server Component rendering
      return { data: null, error: "Session expired" };
    }

    // Only log if it's not a 401 (which is expected for guest users)
    if (
      !message.includes("401") &&
      !message.includes("Unauthorized") &&
      !message.includes("Internal Server Error")
    ) {
      console.error("[getProfileAction] Failed to fetch profile:", message);
      console.error("[getProfileAction] Error object:", error);
    }
    return { data: null, error: message };
  }
});

/**
 * Cập nhật thông tin profile.
 * Hỗ trợ đổi tên và đổi mật khẩu.
 *
 * @param formData - Dữ liệu form (name, currentPassword, newPassword)
 * @returns { success: true } hoặc { error: string }
 *
 * @example
 * // Form đổi tên
 * <form action={updateProfileAction}>
 *   <input name="name" defaultValue="Nguyễn Văn A" />
 *   <button type="submit">Lưu</button>
 * </form>
 *
 * @example
 * // Form đổi mật khẩu
 * <form action={updateProfileAction}>
 *   <input name="currentPassword" type="password" />
 *   <input name="newPassword" type="password" />
 *   <button type="submit">Đổi mật khẩu</button>
 * </form>
 */
export async function updateProfileAction(formData: FormData) {
  // Lấy dữ liệu từ form
  const name = formData.get("name")?.toString();
  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword = formData.get("newPassword")?.toString();
  const avatar = formData.get("avatar") as File | null;
  const deleteAvatar = formData.get("deleteAvatar") === "true";

  // Xây dựng payload dựa trên dữ liệu có sẵn
  // Validate input
  const rawData = {
    name: name || undefined,
    currentPassword: currentPassword || undefined,
    newPassword: newPassword || undefined,
  };

  const parsed = ProfileUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    name: validatedName,
    currentPassword: validatedCurrentPassword,
    newPassword: validatedNewPassword,
  } = parsed.data;

  // Xây dựng payload dựa trên dữ liệu có sẵn
  const payload: {
    firstName?: string;
    lastName?: string;
    password?: string;
    newPassword?: string;
    avatarUrl?: string | null;
  } = {};

  // Xử lý tên
  if (validatedName) {
    const nameParts = validatedName.split(" ");
    payload.firstName = nameParts[0];
    payload.lastName = nameParts.slice(1).join(" ") || "";
  }

  // Xử lý đổi mật khẩu
  if (validatedCurrentPassword && validatedNewPassword) {
    payload.password = validatedCurrentPassword;
    payload.newPassword = validatedNewPassword;
  }

  // Xử lý xóa avatar
  if (deleteAvatar) {
    payload.avatarUrl = null;
  }

  try {
    if (avatar && avatar.size > 0) {
      // Nếu có avatar mới, gửi dưới dạng FormData
      const data = new FormData();
      if (payload.firstName) data.append("firstName", payload.firstName);
      if (payload.lastName) data.append("lastName", payload.lastName);
      if (payload.password) data.append("password", payload.password);
      if (payload.newPassword) data.append("newPassword", payload.newPassword);
      data.append("image", avatar);

      await http("/auth/me", {
        method: "PATCH",
        body: data,
      });
    } else {
      // Ngược lại gửi JSON như cũ
      await http("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    }

    // Revalidate profile page để hiển thị dữ liệu mới
    revalidatePath("/profile");
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể cập nhật profile";
    return { error: message };
  }
}

/**
 * Generate 2FA Secret & QR Code
 */
export async function generateTwoFactorAction() {
  await cookies();
  try {
    const res = await http<ApiResponse<{ secret: string; qrCode: string }>>(
      "/auth/2fa/generate",
      {
        method: "POST",
      }
    );
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Enable 2FA
 */
export async function enableTwoFactorAction(token: string, secret: string) {
  await cookies();
  try {
    await http("/auth/2fa/enable", {
      method: "POST",
      body: JSON.stringify({ token, secret }),
    });
    revalidatePath("/profile");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Disable 2FA
 */
export async function disableTwoFactorAction(token: string) {
  await cookies();
  try {
    await http("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    revalidatePath("/profile");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}
