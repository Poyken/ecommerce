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
    // Only log if it's not a 401 (which is expected for guest users)
    if (!message.includes("401") && !message.includes("Unauthorized")) {
      console.error("[getProfileAction] Failed to fetch profile:", message);
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
