
/**
 * Centralized Environment Variables
 * Use this file to access environment variables throughout the application.
 * This ensures consistency and makes it easier to manage defaults.
 */

export const env = {
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1",
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NEXT_PUBLIC_SOCKET_URL:
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8081",
  NODE_ENV: process.env.NODE_ENV || "development",
};
