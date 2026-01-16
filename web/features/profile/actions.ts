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
 *    - Xử lý các case 401 (Unauthorized) để tự động force logout nếu phiên làm việc hết hạn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Personalization: Quản lý toàn bộ thông tin cá nhân của khách hàng như ảnh đại diện (avatar), tên hiển thị và mật khẩu một cách an toàn.
 * - Multi-factor Security: Tăng cường bảo mật tài khoản bằng cách cung cấp các action để thiết lập xác thực 2 lớp (2FA), giúp bảo vệ triệt để dữ liệu khách hàng.

 * =====================================================================
 */

"use server";

import { ProfileUpdateSchema } from "@/lib/schemas";
import { User } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { cache } from "react";
import { cookies } from "next/headers";

// =============================================================================
// 📦 TYPES - Định nghĩa kiểu dữ liệu
// =============================================================================

// =============================================================================
// 📝 SERVER ACTIONS - Các hành động xử lý profile
// =============================================================================

import { profileService } from "./services/profile.service";

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
export const getProfileAction = cache(async () => {
  await cookies();
  return wrapServerAction(
    () => profileService.getProfile(),
    "Failed to fetch profile"
  );
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

      return wrapServerAction(async () => {
        const res = await profileService.updateProfile(data);
        REVALIDATE.profile();
        return res;
      }, "Không thể cập nhật profile");
    } else {
      // Ngược lại gửi JSON như cũ
      return wrapServerAction(async () => {
        const res = await profileService.updateProfile(payload);
        REVALIDATE.profile();
        return res;
      }, "Không thể cập nhật profile");
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Không thể cập nhật profile";
    return { success: false, error: message };
  }
}

/**
 * Generate 2FA Secret & QR Code
 */
export async function generateTwoFactorAction() {
  await cookies();
  return wrapServerAction(
    () => profileService.generateTwoFactor(),
    "Failed to generate 2FA"
  );
}

/**
 * Enable 2FA
 */
export async function enableTwoFactorAction(token: string, secret: string) {
  await cookies();
  return wrapServerAction(async () => {
    const res = await profileService.enableTwoFactor(token, secret);
    REVALIDATE.profile();
    return res;
  }, "Failed to enable 2FA");
}

/**
 * Disable 2FA
 */
export async function disableTwoFactorAction(token: string) {
  await cookies();
  return wrapServerAction(async () => {
    const res = await profileService.disableTwoFactor(token);
    REVALIDATE.profile();
    return res;
  }, "Failed to disable 2FA");
}
