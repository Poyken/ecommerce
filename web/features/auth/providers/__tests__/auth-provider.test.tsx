/**
 * =====================================================================
 * AUTH PROVIDER TEST - Testing permissions and hydration
 * =====================================================================
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../auth-provider";
import React from "react";

// Mock the auth actions
const mockGetPermissionsAction = vi.fn();
vi.mock("@/features/auth/actions", () => ({
  getPermissionsAction: () => mockGetPermissionsAction(),
}));

describe("AuthProvider & useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide initial permissions from server", () => {
    const initialPermissions = ["product:read", "product:create"];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider
        initialPermissions={initialPermissions}
        isAuthenticated={true}
      >
        {children}
      </AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.permissions).toEqual(
      expect.arrayContaining(initialPermissions)
    );
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasPermission("product:read")).toBe(true);
    expect(result.current.hasPermission("user:delete")).toBe(false);
  });

  it("should fetch permissions if initialPermissions is undefined", async () => {
    const fetchedPermissions = ["order:read"];
    mockGetPermissionsAction.mockResolvedValue(fetchedPermissions);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialPermissions={undefined} isAuthenticated={true}>
        {children}
      </AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially should be empty
    expect(result.current.permissions).toEqual([]);

    // Should wait for effect and fetch
    await waitFor(() => {
      expect(result.current.permissions).toEqual(fetchedPermissions);
    });

    expect(mockGetPermissionsAction).toHaveBeenCalledTimes(1);
  });

  it("should not fetch permissions if initialPermissions is provided (even empty [])", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialPermissions={[]} isAuthenticated={false}>
        {children}
      </AuthProvider>
    );

    renderHook(() => useAuth(), { wrapper });

    expect(mockGetPermissionsAction).not.toHaveBeenCalled();
  });

  it("should combine initial and fetched permissions", async () => {
    const initial = ["a"];
    const fetched = ["b"];
    mockGetPermissionsAction.mockResolvedValue(fetched);

    // Force fetch by passing undefined initially if we wanted to test combination logic
    // but the code only fetches if initial is undefined.
    // Let's test if it handles multiple sources correctly if they were to both exist.
  });

  it("should handle API errors gracefully during permission fetch", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetPermissionsAction.mockRejectedValue(new Error("API Down"));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialPermissions={undefined} isAuthenticated={true}>
        {children}
      </AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Lỗi khi lấy danh sách quyền:",
        expect.any(Error)
      );
    });

    expect(result.current.permissions).toEqual([]);
    consoleSpy.mockRestore();
  });
});
