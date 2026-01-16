/**
 * =====================================================================
 * AUTH SERVER ACTIONS - Xác thực người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER ACTIONS LÀ GÌ?
 * - Là các hàm async chạy hoàn toàn trên server, nhưng được gọi từ Client Component như hàm bình thường.
 * - Directive `"use server"` bảo Next.js tạo API endpoint ngầm cho file/hàm này.
 *
 * 2. COOKIE-BASED SESSION:
 * - Sau khi login API trả về token, ta phải lưu vào HttpOnly Cookie ngay trên server bằng `cookies().set(...)`.
 * - Tại sao HttpOnly? -> Để JavaScript phía client không đọc được -> Chống XSS (Cross-Site Scripting).
 *
 * 3. VALIDATION (Zod):
 * - Dữ liệu từ Form (Client) không bao giờ được tin tưởng.
 * - Luôn dùng Zod validate email/password trước khi gửi sang Backend API để tiết kiệm request lỗi. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Secure Onboarding: Tiếp nhận người dùng mới một cách an toàn qua các form Đăng ký/Đăng nhập đã được bảo vệ bởi CSRF và HttpOnly Cookies.
 * - Identity Management: Quản lý phiên làm việc tập trung, hỗ trợ đăng nhập mạng xã hội (Social Login) và xác thực đa lớp (2FA) để đảm bảo an toàn tuyệt đối cho tài khoản.

 * =====================================================================
 */

"use server";

import { generateCsrfToken } from "@/lib/csrf";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/schemas";
import { createSession, logout } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { authService } from "./services/auth.service";

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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 * 1. FLOW XỬ LÝ: Validate -> Gọi API -> Nhận Token -> Lưu Session.
 * 2. MFA HANDLING: Nếu backend trả về `mfaRequired`, ta không tạo session ngay mà trả về flag để frontend hiển thị ô nhập mã OTP.
 * 3. SECURITY: Luôn reset CSRF token khi tạo session mới để tránh tấn công Session Fixation.
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
    // Gọi API đăng nhập
    const response = await authService.login(parsed.data);

    const { accessToken, refreshToken, mfaRequired, userId } = response.data;

    // Handle 2FA Case
    if (mfaRequired && userId) {
      return {
        success: false,
        mfaRequired: true,
        userId: userId,
      };
    }

    if (accessToken && refreshToken) {
      // Lưu tokens vào Session (HttpOnly cookies)
      await createSession(accessToken, refreshToken);
      // Reset CSRF token for New Session
      await generateCsrfToken();

      // Revalidate to ensure all components get the new session state
      revalidatePath("/", "layout");

      // Get permissions from token for client-side redirect logic
      const permissions = getPermissionsFromToken(accessToken);
      return { success: true, permissions };
    } else {
      return { error: "Login failed - No tokens received" };
    }
  } catch (error: unknown) {
    return {
      error: (error as Error).message || "Failed to login",
    };
  }
}

/**
 * Action Login với 2FA Code
 */
export async function login2FAAction(userId: string, token: string) {
  try {
    const response = await authService.login2FA(userId, token);

    const { accessToken, refreshToken } = response.data;
    // Lưu tokens vào Session (HttpOnly cookies)
    await createSession(accessToken, refreshToken);
    await generateCsrfToken();
    revalidatePath("/", "layout");

    // Get permissions from token for client-side redirect logic
    const permissions = getPermissionsFromToken(accessToken);
    return { success: true, permissions };
  } catch (error: unknown) {
    return {
      success: false,
      error: (error as Error).message || "Invalid 2FA Code",
    };
  }
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
    const response = await authService.register(parsed.data);

    const { accessToken, refreshToken } = response.data;
    await createSession(accessToken, refreshToken);
    // Reset CSRF token for New Session
    await generateCsrfToken();
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
    await authService.forgotPassword(parsed.data);
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
    await authService.resetPassword({
      token: parsed.data.token,
      newPassword: parsed.data.newPassword,
    });
    return { success: true, message: "Password updated" };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to reset password" };
  }
}
