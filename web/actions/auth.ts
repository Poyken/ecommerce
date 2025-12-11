"use server";

import { http } from "@/lib/http";
import { createSession, logout } from "@/lib/session";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const parsed = loginSchema.safeParse({ email, password });

  if (!parsed.success) {
    return {
      error: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // API trả về { statusCode, message, data: { accessToken, ... } }
    const response = await http<{
      data: {
        accessToken: string;
        refreshToken: string;
        // user: any;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });

    const { accessToken, refreshToken } = response.data;

    await createSession(accessToken, refreshToken);
  } catch (error: any) {
    return {
      error: error.message || "Failed to login",
    };
  }

  return { success: true };
}

export async function logoutAction() {
  await logout();
}

export async function registerAction(prevState: any, formData: FormData) {
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
    const response = await http<{
      data: {
        accessToken: string;
        refreshToken: string;
      };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });

    const { accessToken, refreshToken } = response.data;
    await createSession(accessToken, refreshToken);
  } catch (error: any) {
    return {
      error: error.message || "Failed to register",
    };
  }

  redirect("/");
}
