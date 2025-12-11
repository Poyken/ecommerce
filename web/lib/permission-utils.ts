import { decodeJwt } from "jose";

export function getPermissionsFromToken(token: string | undefined | null): string[] {
  if (!token) return [];
  try {
    const payload = decodeJwt(token);
    return (payload.permissions as string[]) || [];
  } catch (error) {
    return [];
  }
}
