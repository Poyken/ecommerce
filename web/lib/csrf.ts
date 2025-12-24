import { nanoid } from "nanoid";
import { cookies, headers } from "next/headers";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

export async function generateCsrfToken() {
  const token = nanoid(32);
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    path: "/",
    httpOnly: false, // Client needs to read this to send in header
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return token;
}

export async function validateCsrfToken() {
  const headerStore = await headers();
  const cookieStore = await cookies();

  const tokenFromHeader = headerStore.get(CSRF_HEADER_NAME);
  const tokenFromCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  return tokenFromHeader === tokenFromCookie;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
