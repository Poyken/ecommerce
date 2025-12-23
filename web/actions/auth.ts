/**
 * =====================================================================
 * AUTH SERVER ACTIONS - Xác thực người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * SERVER ACTIONS LÀ GÌ?
 * - Là các hàm async chạy trên server, nhưng có thể gọi trực tiếp từ client.
 * - Thay thế cho việc phải tạo API Route thủ công (như Pages Router).
 * - Được đánh dấu bằng directive `"use server"` ở đầu file hoặc đầu hàm.
 *
 * CÁCH HOẠT ĐỘNG:
 * 1. Client gọi Action (như gọi hàm bình thường).
 * 2. Next.js tự động gửi POST request đến server.
 * 3. Server thực thi hàm, có thể truy cập Database, Cookies, Headers...
 * 4. Trả về kết quả cho Client.
 *
 * FORM HANDLING VỚI `useActionState`:
 * - Action thường nhận vào `prevState` và `formData`.
 * - `prevState`: Trạng thái cũ của form (để hiển thị lỗi validation).
 * - `formData`: Dữ liệu từ form HTML.
 *
 * SECURITY:
 * - Server Actions luôn phải validate dữ liệu đầu vào (dùng Zod).
 * - Không bao giờ tin tưởng dữ liệu từ Client.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/schemas";
import { createSession, logout } from "@/lib/session";
import { ApiResponse } from "@/types/dtos";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Lấy danh sách permissions từ token trong cookie.
 * Dùng cho client components cần fetch permissions.
 */
export async function getPermissionsAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  return getPermissionsFromToken(token);
}

/**
 * Action Đăng nhập.
 *
 * FLOW:
 * 1. Validate form data với Zod
 * 2. Gọi API /auth/login
 * 3. Lưu tokens vào Session (cookies)
 * 4. Trả về { success: true } hoặc { error: "..." }
 *
 * @param prevState - State trước đó (dùng với useActionState)
 * @param formData - Dữ liệu form (email, password)
 */
export async function loginAction(prevState: unknown, formData: FormData) {
  // Trigger dynamic access before try/catch
  await cookies();

  const email = formData.get("email");
  const password = formData.get("password");

  // Validate dữ liệu đầu vào
  const parsed = loginSchema.safeParse({ email, password });

  if (!parsed.success) {
    return {
      error: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // Gọi API đăng nhập - Trả về { data: { accessToken, refreshToken } }
    const response = await http<
      ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      skipRedirectOn401: true,
    });

    const { accessToken, refreshToken } = response.data;

    // Lưu tokens vào Session (HttpOnly cookies)
    await createSession(accessToken, refreshToken);

    // Revalidate to ensure all components get the new session state
    revalidatePath("/", "layout");
  } catch (error: unknown) {
    return {
      error: (error as Error).message || "Failed to login",
    };
  }

  return { success: true };
}

/**
 * Action Đăng xuất.
 * Xóa Session và redirect về trang chủ.
 */
export async function logoutAction() {
  await logout();
  revalidatePath("/", "layout");
}

/**
 * Action xử lý Login Social.
 * Nhận accessToken và refreshToken từ URL callback, lưu vào session.
 */
export async function socialLoginAction(
  accessToken: string,
  refreshToken: string
) {
  try {
    await createSession(accessToken, refreshToken);
    // Guest cart merge logic handled in client
    return { success: true };
  } catch {
    return { error: "Failed to create session" };
  }
}

/**
 * Action Đăng ký tài khoản mới.
 *
 * FLOW:
 * 1. Validate form data
 * 2. Gọi API /auth/register
 * 3. Tự động đăng nhập (lưu tokens)
 * 4. Redirect về trang chủ
 *
 * @param prevState - State trước đó
 * @param formData - Dữ liệu form (email, password, firstName, lastName)
 */
export async function registerAction(prevState: unknown, formData: FormData) {
  await cookies();
  const email = formData.get("email");
  const password = formData.get("password");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");

  const parsed = registerSchema.safeParse({
    email,
    password,
    firstName,
    lastName,
  });

  if (!parsed.success) {
    return {
      error: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const response = await http<
      ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>
    >("/auth/register", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });

    const { accessToken, refreshToken } = response.data;
    await createSession(accessToken, refreshToken);
  } catch (error: unknown) {
    return {
      error: (error as Error).message || "Failed to register",
    };
  }

  return { success: true };
}

/**
 * Action Quên mật khẩu.
 * Gửi email chứa link đặt lại mật khẩu đến email của user.
 *
 * @param prevState - State trước đó
 * @param formData - Dữ liệu form (email)
 */
export async function forgotPasswordAction(
  prevState: unknown,
  formData: FormData
) {
  await cookies();
  const email = formData.get("email");
  const parsed = forgotPasswordSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      error: "Invalid email",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await http("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    return { success: true, message: "Email sent" };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to send email" };
  }
}

/**
 * Action Đặt lại mật khẩu mới.
 * Sử dụng token từ email để verify và cập nhật mật khẩu.
 *
 * @param prevState - State trước đó
 * @param formData - Dữ liệu form (token, newPassword, confirmPassword)
 */
export async function resetPasswordAction(
  prevState: unknown,
  formData: FormData
) {
  await cookies();
  const token = formData.get("token");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  const parsed = resetPasswordSchema.safeParse({
    token,
    newPassword,
    confirmPassword,
  });

  if (!parsed.success) {
    return {
      error: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await http("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: parsed.data.token,
        newPassword: parsed.data.newPassword,
      }),
    });
    return { success: true, message: "Password updated" };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to reset password" };
  }
}
