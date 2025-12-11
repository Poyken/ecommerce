"use server";

import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export const getProfileAction = cache(async () => {
  try {
    const res = await http<{ data: any }>("/auth/me");
    return { data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
});

export async function updateProfileAction(formData: FormData) {
  const name = formData.get("name")?.toString();
  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword = formData.get("newPassword")?.toString();

  const payload: any = {};
  if (name) payload.firstName = name.split(" ")[0]; // Đơn giản hóa: giả sử phân tách bằng dấu cách
  if (name) payload.lastName = name.split(" ").slice(1).join(" ") || "";

  if (currentPassword && newPassword) {
    payload.password = currentPassword; // Thường chỉ để xác minh
    payload.newPassword = newPassword;
  }

  // Lưu ý: Triển khai API cho thay đổi mật khẩu có thể cần tinh chỉnh
  // nhưng hiện tại chúng ta gửi những gì chúng ta có. Logic updateProfile của API có thể cần kiểm tra mật khẩu.

  try {
    await http("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update profile" };
  }
}
