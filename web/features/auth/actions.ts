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
import { actionClient, createActionWrapper } from "@/lib/safe-action";
import { authService } from "./services/auth.service";

// --- ACTIONS ---

/**
 * Action Đăng nhập.
 */
const safeLogin = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const response = await authService.login(parsedInput);
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
      await createSession(accessToken, refreshToken);
      await generateCsrfToken();
      revalidatePath("/", "layout");

      const permissions = getPermissionsFromToken(accessToken);
      return { success: true, permissions };
    }

    throw new Error("Invalid credentials or server error");
  });

export const loginAction = createActionWrapper(safeLogin, "Đăng nhập thất bại");

/**
 * Action Đăng ký tài khoản mới.
 */
const safeRegister = actionClient
  .schema(registerSchema)
  .action(async ({ parsedInput }) => {
    const response = await authService.register(parsedInput);
    const { accessToken, refreshToken } = response.data;

    await createSession(accessToken, refreshToken);
    await generateCsrfToken();
    revalidatePath("/", "layout");
    
    return { success: true };
  });

export const registerAction = createActionWrapper(safeRegister, "Đăng ký thất bại");

/**
 * Action Login với 2FA Code
 */
export async function login2FAAction(userId: string, token: string) {
  try {
    const response = await authService.login2FA(userId, token);
    const { accessToken, refreshToken } = response.data;
    
    await createSession(accessToken, refreshToken);
    await generateCsrfToken();
    revalidatePath("/", "layout");

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
 */
export async function logoutAction() {
  await logout();
  revalidatePath("/", "layout");
}

/**
 * Action xử lý Login Social.
 */
export async function socialLoginAction(
  accessToken: string,
  refreshToken: string,
) {
  try {
    await createSession(accessToken, refreshToken);
    return { success: true };
  } catch {
    return { error: "Failed to create session" };
  }
}

/**
 * Action Quên mật khẩu.
 */
const safeForgotPassword = actionClient
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    await authService.forgotPassword(parsedInput);
    return { success: true, message: "Email sent" };
  });

export const forgotPasswordAction = createActionWrapper(safeForgotPassword, "Không thể gửi email");

/**
 * Action Đặt lại mật khẩu mới.
 */
const safeResetPassword = actionClient
  .schema(resetPasswordSchema)
  .action(async ({ parsedInput }) => {
    await authService.resetPassword({
      token: parsedInput.token,
      newPassword: parsedInput.newPassword,
    });
    return { success: true, message: "Password updated" };
  });

export const resetPasswordAction = createActionWrapper(safeResetPassword, "Không thể đặt lại mật khẩu");

/**
 * Action lấy danh sách quyền từ token hiện tại (Dùng cho Client-side sync).
 */
export async function getPermissionsAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return [];
  
  try {
    return getPermissionsFromToken(token);
  } catch {
    return [];
  }
}
