
/**
 * Centralized Environment Variables
 * Use this file to access environment variables throughout the application.
 * This ensures consistency and makes it easier to manage defaults.
 */

export const env = {
  NEXT_PUBLIC_API_URL: (() => {
    const val = process.env.NEXT_PUBLIC_API_URL;
    if (!val && process.env.NODE_ENV === "production") {
      throw new Error(
        "❌ MISSING ENV: NEXT_PUBLIC_API_URL is required in production!"
      );
    }
    return val || "http://localhost:8081/api/v1";
  })(),
  NEXT_PUBLIC_APP_URL: (() => {
    const val = process.env.NEXT_PUBLIC_APP_URL;
    if (!val && process.env.NODE_ENV === "production") {
      throw new Error(
        "❌ MISSING ENV: NEXT_PUBLIC_APP_URL is required in production!"
      );
    }
    return val || "http://localhost:3000";
  })(),
  NEXT_PUBLIC_SOCKET_URL:
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8081",
  NODE_ENV: process.env.NODE_ENV || "development",
};
